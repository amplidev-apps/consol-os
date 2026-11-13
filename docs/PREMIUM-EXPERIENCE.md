# Consol OS — Estudo: da "distro adaptada" à experiência de console premium

> Documento de planejamento. Pesquisa baseada em SteamOS 3 / Steam Machine, Bazzite, RetroDECK 0.10.x, ES-DE, RecompLauncher e sentimentos da comunidade (nov/2026).

## O que já temos (v0.1)

- Bazzite NVIDIA (driver 580.x), bootc, atomics + rollback, Big Picture no login
- RecompLauncher empacotado + desktop entry + ícone oficial
- RetroArch nativo + RetroDECK (via Flathub no kickstart)
- Marca Consol OS oficial (Nexus): cores, wallpaper, SDDM/Plymouth próprios (pendentes de ativação)

## Onde está o fosso entre "adaptado" e "console premium"

| "Distro adaptada" | "Console premium" |
|---|---|
| Usuário abre o Steam e configura na mão | Primeiro boot conduz o usuário; ligou → está jogando |
| 3 bibliotecas separadas (Steam, ROMs, recomps) | **Uma biblioteca unificada** com artes, ordem e categorias |
| Precisa saber que precisa de internet/login | Login Steam + contas já integradas no assistente |
| Tela de login genérica | Boot com chime + tema próprio + "welcome to Consol" |
| Atualizações "normais de PC" | Atualizações silenciosas de console (atomic) + novidades in-game |
| Sem orientação a um público | Fluxo pensado para TV/sofá/controle de 10 pés |

## Pilares e funcionalidades propostas

### 1. Ligou → jogou (fricção zero)
- **Autologin no modo console** (SDDM autologin opcional; hoje já abre o Big Picture no KDE login)
- **Consol First-Run Wizard** (tela única pós-instalação): login Steam → instala RetroDECK (já incluso) → adiciona RecompLauncher ao Big Picture → sugere perfil de controle "Console padrão" → pergunta idioma "PT-BR" → define RetroAchievements → grava tudo. Sem terminal.
- **Chime de boot** (arquivo de áudio + Plymouth): reforço sensorial de "console" (onda de marca no power-on)
- **Power button = suspend/resume** (S3/s2idle) para "retomar de onde parou" — testar no hardware com NVIDIA

### 2. Uma biblioteca, não três
- **RetroDECK + RetroAchievements** já dentro do ES-DE: conquistas retrô nativas
- **Steam Rom Manager** (vem no RetroDECK) apontando para Steam como destino único
- **Artes automáticas para atalhos não-Steam** (RecompLauncher, emuladores): baixadas pelo wizard no primeiro run
- **Categorias "prateleira"**: Steam, RetroDECK (ES-DE), Recompilados — coleção visual única no Big Picture
- **Hero art unificada** (paleta Consol) nos atalhos criados

### 3. Conforto de 10 pés (TV)
- KDE com escala 150–200% no perfil "TV"
- **Game mode dedicado**: atalho `Super+G` ou botão guide → Big Picture; `Steam+B` ausente → volta ao desktop
- **Screensaver de artes do jogo** (nativo no Big Picture desde 2026: recent-played art slideshow) — deixar ativado por padrão no perfil
- **HDR automático** quando o display reporta HDR (KDE + Steam já expõem; documentar)
- **Áudio night/volume** padrão TV

### 4. Recompilados como cidadão de primeira classe (nosso diferencial)
- RecompLauncher com **Big Picture próprio** (tem) + atalho na biblioteca com arte
- **Consol Recomp Radar**: script de notificação (in-app? CLI?) que lista recomps recém-atualizados/publicados via recomplauncher.com (feed) — decisão: implementar como widget de notificações do KDE (plasma-notify) opcional, off por padrão
- **Biblioteca local de recomps visível no Big Picture**: RecompLauncher tem "Add to Steam" nativo → o wizard faz isso automaticamente

### 5. Vibes de console de fábrica
- **Bazzite já entrega**: Gamescope, Steam Input, Proton otimizado, uupd (updates), rollback atômico — manter e exibir no wizard como "seu sistema de console"
- **Atualizações no estilo console**: diálogo de boot "Consol OS atualizado" com resumo (changelog) — usar MOTD/kde notifications
- **Family View** sugerida no wizard (casa com crianças)
- **Perfis**: "Hóspede" (Steam Family View + somente Big Picture) e "Adulto" (desktop completo)

### 6. Comunidade/Marca
- **Avatar Consol** para perfis, badges para compartilhamento
- **"Consol On"**: página do Discord + canal de novidades (fora da imagem, mas parte da marca)
- **Metadados ArtifactHub/Flathub** quando o RecompLauncher for aceito

### 7. "Invisível mas essencial"
- **Rollback de um toque** no boot menu (Bazzite/bootc já tem — documentar "se algo quebrar, 1 clique")
- **Saves**: orientação no wizard: Steam Cloud (jogos Steam), RecompLauncher Cloud (recomps), RetroDECK Backup (ES-DE → Configurator → Backup)
- **Telemetria**: nada coletado (diferente do SteamOS em 2001); documentar

## Matriz de esforço/impacto

| Feature | Esforço | Impacto | Fase |
|---|---|---|---|
| First-Run Wizard (script + kdialog) | Alto | Altíssimo | v0.3 |
| Artes automáticas nos atalhos não-Steam | Médio | Alto | v0.2/v0.3 |
| Chime de boot | Baixo | Médio | v0.2 |
| Autologin + suspend sane | Baixo/Médio | Alto | v0.2 |
| Documentação de rollback | Baixo | Alto | v0.2 |
| Categorias únicas na biblioteca | Médio | Alto | v0.3 |
| Screensaver de artes (config) | Baixo | Médio | v0.2 |
| HDR/TV scale profile | Médio | Médio | v0.3 |
| Family View / Hóspede | Médio | Alto (público familiar) | v0.4 |
| Recomp Radar (notificações) | Alto | Médio | v0.4/v1.0 |
| SDDM+Plymouth ativados | Baixo | Alto (polish) | v0.2 (após VM test) |

## Riscos e anti-objetivos

- **Não replicar assets/UX oficial do Xbox ou SteamOS literalmente** (marca e IP) — estilo próprio Nexus
- **Não distribuir conteúdo de jogos** — sempre "traga sua cópia"
- **Não travar usuário em modo console**: desktop sempre acessível (config + atalho)
- **Não prometer Quick Resume garantido** em jogos Windows via Proton — funciona em muitos, não em todos; documentar realidade
- **Manter caminho de suporte**: docs PT-BR, nenhum fluxo exige terminal para o usuário final
- NVIDIA + Wayland/Gamescope: **instável**; padrão = KDE + Big Picture, testar em VM/HW antes de distribuir

## Fases

- **v0.1 (agora)**: imagem base + RecompLauncher + RetroDECK + marca no sistema (atual)
- **v0.2**: SDDM/Plymouth ativados, chime, autologin opcional, screensaver de artes, docs fallback, PT-BR padrão, primeiro build verde isolado em VM
- **v0.3**: First-Run Wizard, artes automáticas, categorias únicas, HDR/TV profile, instalação pública completa
- **v0.4/v1.0**: Family View/Hóspede, Recomp Radar, Flatpak oficial do RecompLauncher (pós-Flathub), assinatura cosign, releases com arte

## Referências

- Steam Big Picture 2026: Big Art Mode, Personal Calendar, Screensaver de artes (game art slideshow), Janela de convites de jogos, Quick Access otimizado
- RetroDECK 0.10.x: ES-DE 3.5, 24 componentes sandboxed, RetroAchievements, Steam ROM Manager incluso, KDE Platform 6.11
- Bazzite: atomic updates, rollback, Game Mode, Bazaar (software center), uupd
