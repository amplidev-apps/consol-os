//! Localização e parsing de bibliotecas locais de jogos.
//!
//! tudo aqui é best-effort: se um manifesto estiver ilegível, o jogo é
//! pulado — nunca vira erro fatal na tela do usuário.

use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

/// Um nó do KeyValues (texto) da Valve.
#[derive(Debug, Clone, Default)]
struct Kv {
    values: BTreeMap<String, String>,
    children: BTreeMap<String, Vec<Kv>>,
}

/// Coleta o primeiro valor com `key` em qualquer nível da árvore.
fn find_value<'a>(kv: &'a Kv, key: &str) -> Option<&'a str> {
    let needle = key.to_lowercase();
    if let Some(v) = kv.values.get(&needle) {
        return Some(v.as_str());
    }
    for children in kv.children.values() {
        for child in children {
            if let Some(v) = find_value(child, &needle) {
                return Some(v);
            }
        }
    }
    None
}

/// Parser mínimo de KeyValues em texto (appmanifest / libraryfolders).
fn parse_kv(input: &str) -> Kv {
    let mut stack: Vec<Kv> = vec![Kv::default()];
    let mut pending_name = String::new();

    for raw in input.lines() {
        let line = raw.trim();
        if line.is_empty() || line.starts_with("//") {
            continue;
        }
        let tokens: Vec<&str> = line.split_whitespace().collect();
        let mut i = 0;
        while i < tokens.len() {
            let tok = tokens[i];
            if tok == "{" {
                stack.push(Kv::default());
                i += 1;
                continue;
            }
            if tok == "}" {
                if let Some(done) = stack.pop() {
                    let name = std::mem::take(&mut pending_name);
                    match stack.last_mut() {
                        Some(parent) => {
                            parent.children.entry(name).or_default().push(done);
                        }
                        // Chave-raiz fechou: devolve o nó diretamente.
                        None => return done,
                    }
                }
                pending_name.clear();
                i += 1;
                continue;
            }
            let key = unquote(tok).to_lowercase();
            let next = i + 1;
            if next < tokens.len() && tokens[next] != "{" && tokens[next] != "}" {
                let value = unquote(tokens[next]);
                if let Some(top) = stack.last_mut() {
                    top.values.insert(key, value);
                }
                i = next + 1;
                continue;
            }
            // Chave de bloco: o nome é consumido pelo "{" seguinte.
            pending_name = key;
            i = next;
        }
    }
    // Arquivos bem formados sempre fecham o último bloco ao final.
    stack.pop().unwrap_or_default()
}

fn unquote(tok: &str) -> String {
    let t = tok.trim();
    if t.starts_with('"') && t.ends_with('"') && t.len() >= 2 {
        return t[1..t.len() - 1].replace("\\\"", "\"").replace("\\\\", "\\");
    }
    t.to_string()
}

/// Candidatos a raiz do Steam (instalado nativo e Flatpak).
fn steam_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();
    if let Some(home) = dirs::home_dir() {
        roots.push(home.join(".local/share/Steam"));
        roots.push(home.join(".steam/steam"));
        roots.push(home.join(".steam"));
        roots.push(home.join(".var/app/com.valvesoftware.Steam/.steam/steam"));
        roots.push(home.join(".var/app/com.valvesoftware.Steam/.local/share/Steam"));
    }
    roots
}

fn find_steam_root() -> Option<PathBuf> {
    steam_roots().into_iter().find(|p| p.join("steamapps").is_dir())
}

/// Coleta todo `path` encontrado na árvore (bibliotecas Steam).
fn collect_paths(kv: &Kv, out: &mut Vec<PathBuf>) {
    if let Some(p) = kv.values.get("path") {
        out.push(PathBuf::from(p.replace('\\', "/")));
    }
    for children in kv.children.values() {
        for child in children {
            collect_paths(child, out);
        }
    }
}

/// Bibliotecas Steam: a raiz + as registradas em libraryfolders.vdf.
fn steam_libraries(root: &PathBuf) -> Vec<PathBuf> {
    let mut libs = vec![root.clone()];
    if let Ok(text) = fs::read_to_string(root.join("steamapps/libraryfolders.vdf")) {
        let mut found = Vec::new();
        collect_paths(&parse_kv(&text), &mut found);
        for p in found {
            if p.join("steamapps").is_dir() && !libs.contains(&p) {
                libs.push(p);
            }
        }
    }
    libs
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct SteamGame {
    pub app_id: u64,
    pub name: String,
    pub size_bytes: u64,
}

/// Todos os jogos Steam instalados em todas as bibliotecas.
pub fn steam_games() -> Vec<SteamGame> {
    let Some(root) = find_steam_root() else { return vec![] };
    let mut games = Vec::new();
    for lib in steam_libraries(&root) {
        let Ok(entries) = fs::read_dir(lib.join("steamapps")) else { continue };
        for entry in entries.flatten() {
            let file_name = entry.file_name().to_string_lossy().to_string();
            if !(file_name.starts_with("appmanifest_") && file_name.ends_with(".acf")) {
                continue;
            }
            let Ok(text) = fs::read_to_string(entry.path()) else { continue };
            let kv = parse_kv(&text);
            let Some(app_id) = find_value(&kv, "appid").and_then(|s| s.parse().ok()) else { continue };
            let name = find_value(&kv, "name").unwrap_or("Jogo sem nome").to_string();
            let size_bytes = find_value(&kv, "SizeOnDisk")
                .or_else(|| find_value(&kv, "bytesToDownload"))
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
            games.push(SteamGame { app_id, name, size_bytes });
        }
    }
    games.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    games.dedup_by(|a, b| a.app_id == b.app_id);
    games
}

/// Caminho do library.json do RecompLauncher (instalação nativa e Flatpak).
fn recomplauncher_library_json() -> Option<PathBuf> {
    let home = dirs::home_dir()?;
    let native = home.join(".local/share/com.recomplauncher.app/library.json");
    if native.is_file() {
        return Some(native);
    }
    let flatpak = home
        .join(".var/app/com.recomplauncher.RecompLauncher/data/com.recomplauncher.app/library.json");
    if flatpak.is_file() {
        return Some(flatpak);
    }
    None
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct RecompGame {
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub game: String,
    #[serde(default)]
    pub size: u64,
    #[serde(default)]
    pub played_secs: u64,
    #[serde(default)]
    pub last_played: u64,
    #[serde(default)]
    pub cover_file: Option<PathBuf>,
    #[serde(default)]
    pub hero_file: Option<PathBuf>,
    #[serde(default)]
    pub logo_file: Option<PathBuf>,
    #[serde(default)]
    pub proton: bool,
}

#[derive(Debug, serde::Deserialize)]
struct RecompLibraryFile {
    #[serde(default)]
    installed: BTreeMap<String, RecompGame>,
}

/// Jogos recompilados instalados, com tudo o que o launcher sabe sobre eles.
pub fn recomp_games() -> Vec<RecompGame> {
    let Some(path) = recomplauncher_library_json() else { return vec![] };
    let Ok(text) = fs::read_to_string(&path) else { return vec![] };
    let Ok(parsed) = serde_json::from_str::<RecompLibraryFile>(&text) else { return vec![] };
    let mut games: Vec<RecompGame> = parsed.installed.into_values().collect();
    games.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    games
}
