//! Consol Home — a dash principal do Consol OS.
//!
//! Uma biblioteca única para tudo o que você joga: Steam, recomps,
//! Heroic/ES-DE/RetroDECK como apps integrados. Tudo local, nada demorado.

mod library;

use library::{RecompGame, SteamGame};

#[tauri::command]
fn list_steam_games() -> Vec<SteamGame> {
    library::steam_games()
}

#[tauri::command]
fn list_recomp_games() -> Vec<RecompGame> {
    library::recomp_games()
}

/// Lança um jogo da Steam via protocolo steam:// (funciona nativo e Flatpak).
#[tauri::command]
fn launch_steam_game(app_id: u64) -> Result<(), String> {
    let uri = format!("steam://run/{app_id}");
    // Nativo primeiro (Bazzite tem `steam` no PATH); Flatpak como fallback.
    let native = std::process::Command::new("steam").arg(&uri).spawn();
    if native.is_ok() {
        return Ok(());
    }
    let flatpak = std::process::Command::new("flatpak")
        .args(["run", "com.valvesoftware.Steam", "steam", &uri])
        .spawn();
    flatpak.map(|_| ()).map_err(|e| format!("não foi possível abrir o Steam: {e}"))
}

/// Lança um recomp pelo wrapper do RecompLauncher.
#[tauri::command]
fn launch_recomp_game(id: String) -> Result<(), String> {
    let wrapper = std::path::Path::new("/usr/bin/recomplauncher");
    let program = if wrapper.is_file() {
        "/usr/bin/recomplauncher"
    } else {
        "recomplauncher"
    };
    std::process::Command::new(program)
        .args(["--play", &id])
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("não foi possível jogar '{id}': {e}"))
}

/// Lança um app externo integrado (Heroic, ES-DE/RetroDECK).
/// `app` is um de: heroic, retrodeck, retroarch.
#[tauri::command]
fn launch_app(app: String) -> Result<(), String> {
    match app.as_str() {
        "heroic" => {
            let native = std::process::Command::new("heroic").spawn();
            if native.is_ok() {
                return Ok(());
            }
            let flatpak = std::process::Command::new("flatpak")
                .args(["run", "com.heroicgameslauncher.hgl"])
                .spawn();
            flatpak.map(|_| ()).map_err(|e| format!("Heroic não encontrado: {e}"))
        }
        "retrodeck" => {
            let flatpak = std::process::Command::new("flatpak")
                .args(["run", "net.retrodeck.retrodeck"])
                .spawn();
            flatpak.map(|_| ()).map_err(|e| format!("RetroDECK não encontrado: {e}"))
        }
        "retroarch" => {
            let native = std::process::Command::new("retroarch").spawn();
            if native.is_ok() {
                return Ok(());
            }
            let flatpak = std::process::Command::new("flatpak")
                .args(["run", "org.libretro.RetroArch"])
                .spawn();
            flatpak.map(|_| ()).map_err(|e| format!("RetroArch não encontrado: {e}"))
        }
        other => Err(format!("app desconhecido: {other}")),
    }
}

/// Sai do modo console e volta para a área de trabalho (encerra o dash).
#[tauri::command]
fn exit_to_desktop(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_steam_games,
            list_recomp_games,
            launch_steam_game,
            launch_recomp_game,
            launch_app,
            exit_to_desktop,
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Consol Home");
}
