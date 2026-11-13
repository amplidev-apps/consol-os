import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import consolSymbol from "./assets/consol-symbol.svg";
import "./index.css";

// ===== Tipos =====
type Tab = "biblioteca" | "recomps" | "apps";
type FocusArea = "tabs" | "grid" | "topbar";

interface SteamGame {
  app_id: number;
  name: string;
  size_bytes: number;
}
interface RecompGame {
  id: string;
  name: string;
  game: string;
  size: number;
  played_secs: number;
  last_played: number;
  cover_file?: string | null;
  hero_file?: string | null;
  logo_file?: string | null;
  proton: boolean;
}
interface AppTile {
  id: "heroic" | "retrodeck";
  name: string;
  subtitle: string;
}

const APP_TILES: AppTile[] = [
  { id: "heroic", name: "Heroic Games", subtitle: "Epic · GOG · Amazon — jogos Windows via Proton" },
  { id: "retrodeck", name: "RetroDECK", subtitle: "ES-DE · RetroArch · 24 componentes — todo o retrô" },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "biblioteca", label: "Biblioteca" },
  { id: "recomps", label: "Recompilados" },
  { id: "apps", label: "Aplicativos" },
];

const GRID_COLS = 6;

// ===== Helpers =====
function fmtSize(bytes: number): string | null {
  if (!bytes) return null;
  const gb = bytes / 1024 / 1024 / 1024;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(bytes / 1024 / 1024)} MB`;
}
function fmtPlaytime(secs: number): string {
  const h = Math.floor(secs / 3600);
  if (h < 1) return `${Math.floor(secs / 60)} min`;
  return `${h}h`;
}
function fmtDate(unixSecs: number): string | null {
  if (!unixSecs) return null;
  return new Date(unixSecs * 1000).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function steamArt(appid: number, kind: "portrait" | "hero") {
  return kind === "portrait"
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`
    : `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_hero.jpg`;
}

// Capa com cadeia de fallback: preferida → alternativa → placeholder
function Cover({ preferred, fallback, alt }: { preferred?: string | null; fallback?: string | null; alt: string }) {
  const [stage, setStage] = useState(0);
  const src = stage === 0 ? preferred : stage === 1 ? fallback : null;
  if (!src) return null;
  return <img src={src} alt={alt} onError={() => setStage((s) => s + 1)} draggable={false} />;
}

// ===== Componente principal =====
export default function App() {
  const [steam, setSteam] = useState<SteamGame[]>([]);
  const [recomps, setRecomps] = useState<RecompGame[]>([]);
  const [tab, setTab] = useState<Tab>("biblioteca");
  const [area, setArea] = useState<FocusArea>("grid");
  const [focus, setFocus] = useState(0); // índice dentro da aba
  const [tabFocus, setTabFocus] = useState(0); // 0..2 abas, 3 = sair
  const [exitFocus, setExitFocus] = useState(false); // foco no botão sair (topbar)
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [clock, setClock] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  // Relógio
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Carrega bibliotecas locais
  useEffect(() => {
    invoke<SteamGame[]>("list_steam_games").then(setSteam).catch(() => setSteam([]));
    invoke<RecompGame[]>("list_recomp_games").then(setRecomps).catch(() => setRecomps([]));
  }, []);

  // Toast some sozinho
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const items = useMemo(() => {
    if (tab === "biblioteca")
      return steam.map((g) => ({ kind: "steam" as const, key: `s-${g.app_id}`, game: g }));
    if (tab === "recomps")
      return recomps.map((g) => ({ kind: "recomp" as const, key: `r-${g.id}`, game: g }));
    return APP_TILES.map((a) => ({ kind: "app" as const, key: `a-${a.id}`, app: a }));
  }, [tab, steam, recomps]);

  // Mantém foco válido ao trocar de aba
  useEffect(() => {
    setFocus(0);
  }, [tab]);

  const showError = useCallback((e: unknown) => {
    setToast(e instanceof Error ? e.message : String(e));
  }, []);

  const launchCurrent = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;
      if (item.kind === "steam") {
        invoke("launch_steam_game", { appId: item.game.app_id }).catch(showError);
      } else if (item.kind === "recomp") {
        invoke("launch_recomp_game", { id: item.game.id }).catch(showError);
      } else {
        invoke("launch_app", { app: item.app.id }).catch(showError);
      }
    },
    [items, showError],
  );

  const exitToDesktop = useCallback(() => {
    invoke("exit_to_desktop").catch(() => {
      window.close();
    });
  }, []);

  // ===== Navegação (teclado + controle) =====
  const move = useCallback(
    (dir: "left" | "right" | "up" | "down") => {
      if (confirmQuit) return;

      if (area === "topbar") {
        if (dir === "down" || dir === "left" || dir === "right") {
          setArea("tabs");
          setTabFocus(dir === "left" ? TABS.length - 1 : 0);
        }
        return;
      }

      if (area === "tabs") {
        if (dir === "left") setTabFocus((i) => (i <= 0 ? TABS.length : i - 1));
        if (dir === "right") setTabFocus((i) => (i >= TABS.length ? 0 : i + 1));
        if (dir === "down") setArea("grid");
        if (dir === "up") {
          setArea("topbar");
          setExitFocus(true);
        }
        if (tabFocus < TABS.length) setTab(TABS[tabFocus].id);
        return;
      }

      // area === "grid"
      if (items.length === 0) {
        if (dir === "up") setArea("tabs");
        return;
      }
      const cols = GRID_COLS;
      let next = focus;
      if (dir === "left") next = Math.max(0, focus - 1);
      if (dir === "right") next = Math.min(items.length - 1, focus + 1);
      if (dir === "up") {
        if (focus < cols) {
          setArea("tabs");
          setTabFocus(Math.min(TABS.length - 1, tab === "apps" ? 2 : tab === "recomps" ? 1 : 0));
          return;
        }
        next = focus - cols;
      }
      if (dir === "down") next = Math.min(items.length - 1, focus + cols);
      setFocus(next);
    },
    [area, confirmQuit, exitFocus, focus, items.length, tab, tabFocus],
  );

  const activate = useCallback(() => {
    if (confirmQuit) {
      exitToDesktop();
      return;
    }
    if (area === "topbar") {
      exitToDesktop();
      return;
    }
    if (area === "tabs") {
      if (tabFocus < TABS.length) setTab(TABS[tabFocus].id);
      else exitToDesktop();
      return;
    }
    launchCurrent(focus);
  }, [area, confirmQuit, exitToDesktop, focus, launchCurrent, tabFocus]);

  const back = useCallback(() => {
    if (confirmQuit) {
      setConfirmQuit(false);
      return;
    }
    if (area === "grid") setArea("tabs");
    else if (area === "topbar") setArea("tabs");
  }, [area, confirmQuit]);

  const askQuit = useCallback(() => setConfirmQuit(true), []);

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      if (map[e.key]) {
        e.preventDefault();
        move(map[e.key]);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      } else if (e.key === "Escape") {
        if (confirmQuit) setConfirmQuit(false);
        else back();
      } else if (e.key === "q" || e.key === "Q") {
        askQuit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, activate, back, askQuit, confirmQuit]);

  // Controle (Gamepad API): edge detection a cada frame
  useEffect(() => {
    let raf = 0;
    let prev: boolean[] = [];
    const poll = () => {
      const pads = navigator.getGamepads?.() ?? [];
      for (const pad of pads) {
        if (!pad) continue;
        const pressed = pad.buttons.map((b) => b.pressed);
        const edge = (i: number) => pressed[i] && !prev[i];
        if (edge(12)) move("up");
        if (edge(13)) move("down");
        if (edge(14)) move("left");
        if (edge(15)) move("right");
        if (edge(0)) activate();
        if (edge(1)) back();
        if (edge(9)) askQuit();
        prev = pressed;
        break; // só o primeiro controle
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [move, activate, back, askQuit]);

  // Scroll automático do item focado para a área visível
  useEffect(() => {
    gridRef.current?.querySelector(".card.focused")?.scrollIntoView({ block: "nearest" });
  }, [focus, tab]);

  const counts = { biblioteca: steam.length, recomps: recomps.length, apps: APP_TILES.length };
  const focusedItem = items[focus];

  // Fundo hero do item focado
  let heroUrl: string | null = null;
  if (focusedItem?.kind === "steam") heroUrl = steamArt(focusedItem.game.app_id, "hero");
  else if (focusedItem?.kind === "recomp" && focusedItem.game.hero_file)
    heroUrl = convertFileSrc(focusedItem.game.hero_file);

  let metaTitle = "Nada aqui ainda";
  let metaChips: string[] = [];
  if (focusedItem?.kind === "steam") {
    metaTitle = focusedItem.game.name;
    const size = fmtSize(focusedItem.game.size_bytes);
    if (size) metaChips.push(size);
    metaChips.push("Steam");
  } else if (focusedItem?.kind === "recomp") {
    metaTitle = focusedItem.game.game || focusedItem.game.name;
    if (focusedItem.game.played_secs > 0)
      metaChips.push(`${fmtPlaytime(focusedItem.game.played_secs)} jogadas`);
    const size = fmtSize(focusedItem.game.size);
    if (size) metaChips.push(size);
    const last = fmtDate(focusedItem.game.last_played);
    if (last) metaChips.push(`por último em ${last}`);
    metaChips.push(focusedItem.game.proton ? "Via Proton" : "RecompLauncher");
  } else if (focusedItem?.kind === "app") {
    metaTitle = focusedItem.app.name;
    metaChips = [focusedItem.app.subtitle];
  }

  return (
    <div className="screen">
      {/* Fundo hero do item em foco */}
      <div
        className={`hero-bg${heroUrl ? " visible" : ""}`}
        style={heroUrl ? { backgroundImage: `url("${heroUrl}")` } : undefined}
      />

      <div className="content">
        {/* Barra superior */}
        <div className="topbar">
          <div className="brand">
            <img src={consolSymbol} alt="Consol OS" width={46} height={46} />
            <div className="brand-name">
              CONSOL <span>OS</span>
            </div>
          </div>
          <div className="topbar-right">
            <div className="clock">{clock}</div>
            <button
              className={`topbar-btn${area === "topbar" && exitFocus ? " focused" : ""}`}
              onMouseEnter={() => {
                setArea("topbar");
                setExitFocus(true);
              }}
              onClick={exitToDesktop}
            >
              ↩ Área de trabalho
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="tabs">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              className={`tab${tab === t.id ? " active" : ""}${
                area === "tabs" && tabFocus === i ? " focused" : ""
              }`}
              onMouseEnter={() => {
                setArea("tabs");
                setTabFocus(i);
              }}
              onClick={() => setTab(t.id)}
            >
              {t.label} <span className="count">{counts[t.id]}</span>
            </button>
          ))}
        </div>

        {/* Grade */}
        <div className="grid" ref={gridRef}>
          {items.length === 0 && (
            <div className="empty">
              <h2>Nada por aqui ainda</h2>
              <p>Instalados aparecem aqui automaticamente. Bora jogar?</p>
            </div>
          )}
          {items.map((item, i) => {
            const focused = area === "grid" && focus === i;
            if (item.kind === "steam") {
              const g = item.game;
              return (
                <button key={item.key} className={`card${focused ? " focused" : ""}`} onClick={() => launchCurrent(i)} onMouseEnter={() => setFocus(i)}>
                  <Cover preferred={steamArt(g.app_id, "portrait")} fallback={`https://steamcdn-a.akamaihd.net/steam/apps/${g.app_id}/header.jpg`} alt={g.name} />
                  <div className="shade" />
                  <span className="tag">Steam</span>
                  <span className="name">{g.name}</span>
                </button>
              );
            }
            if (item.kind === "recomp") {
              const g = item.game;
              const cover = g.cover_file ? convertFileSrc(g.cover_file) : null;
              return (
                <button key={item.key} className={`card${focused ? " focused" : ""}`} onClick={() => launchCurrent(i)} onMouseEnter={() => setFocus(i)}>
                  {cover && <img src={cover} alt={g.game || g.name} draggable={false} />}
                  {!cover && (
                    <div className="fallback">
                      <img src={consolSymbol} width={64} height={64} alt="" />
                      <div className="fallback-title">{g.game || g.name}</div>
                    </div>
                  )}
                  <div className="shade" />
                  <span className="tag">Recomp</span>
                  <span className="name">{g.game || g.name}</span>
                </button>
              );
            }
            const a = item.app;
            return (
              <button key={item.key} className={`card appcard${focused ? " focused" : ""}`} onClick={() => launchCurrent(i)} onMouseEnter={() => setFocus(i)}>
                <div className="app-icon">
                  <img src={consolSymbol} width={96} height={96} alt={a.name} />
                </div>
                <div className="shade" />
                <span className="tag">App</span>
                <span className="name">{a.name}</span>
              </button>
            );
          })}
        </div>

        {/* Barra de metadados */}
        <div className="meta-bar">
          <div className="meta-left">
            <div className="meta-title">{metaTitle}</div>
            <div className="meta-sub">
              {metaChips.map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          </div>
          <div className="meta-hint">
            <span className="chip"><b>A</b> Jogar</span>
            <span className="chip"><b>B</b> Voltar</span>
            <span className="chip"><b>≡</b> Sair</span>
          </div>
        </div>
      </div>

      {/* Overlay de confirmação */}
      {confirmQuit && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
          }}
        >
          <div
            style={{
              background: "#161616",
              border: "1px solid #107c10",
              borderRadius: 14,
              padding: "26px 34px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "0 0 60px rgba(16,124,16,0.35)",
            }}
          >
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 28, fontWeight: 800, letterSpacing: "0.08em" }}>
              VOLTAR À ÁREA DE TRABALHO?
            </div>
            <div style={{ color: "#8ed08e", fontSize: 16 }}>O Consol Home fecha e o desktop do KDE aparece.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="topbar-btn focused" onClick={() => setConfirmQuit(false)}>Continuar jogando</button>
              <button className="topbar-btn" onClick={exitToDesktop}>Sair</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "#1e1e1e",
            border: "1px solid #ff5a5a",
            color: "#ffb3b3",
            padding: "10px 22px",
            borderRadius: 10,
            fontSize: 15,
            maxWidth: 640,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
