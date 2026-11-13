# Consol

**Consol** é uma distro Linux **focada em jogos** — experiência de console (controle em toda a interface) com opção de modo desktop — baseada no [Bazzite](https://bazzite.gg) (Fedora Atomic, `bootc`), com:

- **Steam integrado de fábrica**, incluindo sincronização de conta e biblioteca (via Bazzite);
- **[RecompLauncher](https://github.com/elripalda/RecompLauncher)** nativo (AppImage empacotado na imagem, integrado ao Steam via "Add to Steam" e ao Big Picture), para jogar os **recompilados da comunidade** (N64Recomp etc.);
- **Emuladores**: RetroArch nativo + [RetroDECK](https://flathub.org/apps/net.retrodeck.retrodeck) via Flatpak no instalador, com interface orientada a controle;
- **Experiência de console**: boot para KDE com Steam Big Picture em tela cheia; para ir ao desktop: Quick Access (botão Xbox/Guide) → **Exit to Desktop** ou `Ctrl+Alt+F2` no teclado. O desktop mode fica acessível a qualquer momento, como no SteamOS.

> Status: **v0.1 (em desenvolvimento)**. Ainda não há ISO publicada. Veja o [Roadmap](#roadmap).

## Por que Bazzite e não do zero?

SteamOS ≈ Arch + imagem imutável customizada pela Valve — reproduzir isso do zero é meses de trabalho e manutenção. O Consol herda, prontos e testados: drivers NVIDIA 580.x (necessários para a GTX 750 Ti Maxwell), Gamescope, Steam com Big Picture, Flatpak, sistema imutável com rollback automático (`bootc`) e atualizações atômicas.

## Máquina de desenvolvimento/alvo

Desenvolvido e instalado na máquina do autor, que é o **hardware de referência**:

| Componente | Detalhe |
|---|---|
| CPU | Intel Core i3-2120 (2c/4t @ 3.3 GHz) — abaixo do recomendado pelo Bazzite (quad-core); funciona, com folga estreita para jogos pesados |
| RAM | 8 GB |
| GPU | **NVIDIA GTX 750 Ti** (Maxwell, driver 580.x — Maxwell não é suportada pelo `nvidia-open`) |
| Discos | SSD #1 (128 GB, Windows) · **SSD #2 (128 GB, destino do Consol, será apagado)** · HDD 320 GB (dados/backup) |
| Firmware | UEFI (Windows está em GPT/UEFI); o Bazzite exige UEFI |

> ⚠️ **Aviso (Maxwell)**: a GTX 750 Ti está no fim da linha nos drivers proprietários. Sempre teste a versão antes de publicar releases.

## Estrutura do repositório

```
Containerfile                 # Imagem bootc: FROM bazzite-nvidia:stable + build.sh
build_files/build.sh          # Instalação de pacotes e do RecompLauncher (SHA-256 fixado)
build_files/recomplauncher.sh # Wrapper sem FUSE (APPIMAGE_EXTRACT_AND_RUN=1)
system_files/                 # Arquivos copiados na raiz da imagem (/)
  etc/xdg/autostart/consol-bigpicture.desktop   # Big Picture no login (removível)
  usr/share/applications/recomplauncher.desktop
  usr/share/icons/hicolor/...                   # ícone do RecompLauncher
disk_config/consol-nvidia.toml # Kickstart da ISO (bootc switch + Flathub + RetroDECK)
disk_config/disk.toml          # Config de disco da imagem anaconda
consol.env                     # Nome/org da imagem (usado pelo Justfile e CI)
```

## Construindo a imagem

### Opção A — GitHub Actions (recomendado)

1. Repositório: `https://github.com/amplidev-apps/consol-os`. Faça push deste diretório na branch `main`.
2. `REPO_ORGANIZATION` em `consol.env` já aponta para `amplidev-apps` e o kickstart (`disk_config/consol-nvidia.toml`) já referencia `ghcr.io/amplidev-apps/consol-os:latest`.
3. O workflow **Build container image** compila e publica em `ghcr.io/amplidev-apps/consol-os:latest` a cada push na `main`.
4. O workflow **Build disk images** gera a ISO (`anaconda-iso`) manualmente (aba *Actions → Build disk images → Run workflow*) e anexa como artefato.
5. Depois do primeiro build, em `ghcr.io` → pacote `consol-os` → *Package settings*: marque o pacote como **público** para o `bootc switch` funcionar em máquinas frescas sem login.

### Opção B — Build local (Linux com podman)

```bash
# na raiz do repositório
just build localhost/consol-os latest   # compila a imagem
just build-iso localhost/consol-os latest  # gera a ISO via bootc-image-builder
```

> Windows não consegue compilar `bootc` localmente sem Linux. No Windows, desenvolva normalmente e deixe a compilação para o Actions (ou use WSL2 com podman).

## Instalação (dual boot com Windows)

> ⚠️ **Backup antes de tudo.** O instalador apaga o disco escolhido.

1. Grave a ISO num pendrive de 16 GB+ (Fedora Media Writer ou Rufus).
2. **Idealmente, desconecte fisicamente o SSD do Windows durante a instalação** (conforme a documentação do Bazzite) e reconecte depois. Alternativa: no particionamento manual do Anaconda, selecione **somente o SSD #2** e marque para formatação.
3. Instale, reinicie e entre no Consol.
4. **Secure Boot**: na primeira instalação, inscreva a chave do Bazzite (MOK) quando solicitado, ou desative o Secure Boot na BIOS. NVIDIA em Secure Boot sem chave inscrita = tela preta.
5. Dual boot: se o GRUB do Bazzite não enxergar o Windows, use o menu de boot UEFI da BIOS (`F11`/`F12`/`F8`, varia por placa H61) — é a recomendação oficial para dual boot em discos separados.

## Pós-instalação

1. **Steam**: abra o Steam, faça login — a sincronização de biblioteca/conta funciona como no Windows.
2. **RecompLauncher**: está no lançador de aplicativos e no menu Game (ícone próprio). No Big Picture: *Library → Add a non-Steam game → RecompLauncher*, ou use a opção **Add to Steam** dentro do próprio RecompLauncher.
3. **Primeiro boot**: o Big Picture abre automaticamente. Para desativar: Configurações do Sistema → Inicialização automática → desative "Steam Big Picture", ou remova `/etc/xdg/autostart/consol-bigpicture.desktop` (com sudo, modo desktop).
4. **Controle**: em Big Picture e no RetroDECK e no RecompLauncher (Big Picture mode próprio), tudo navega com o controle.
5. **Modo desktop**: Quick Access → Exit to Desktop, ou `Steam+B`/botão do menu → sair do Big Picture. No desktop, use mouse e teclado normalmente.

## Roadmap

- [x] **v0.1** — imagem bootc baseada em bazzite-nvidia, RecompLauncher empacotado com SHA-256, RetroArch RPM, autostart Big Picture, ISO via CI
- [ ] **v0.2** — branding (os-release, logo, SDDM theme), KDE defaults orientados a controle, ícones próprios
- [ ] **v0.3** — RetroDECK pré-instalado também via módulo do image (não só kickstart), análise `bootc container lint` limpo
- [ ] **v0.4** — Flatpak do RecompLauncher (quando for publicado no Flathub) no lugar da AppImage
- [ ] **v1.0** — ISO assinada (cosign), documentação de instalação completa, release pública

## Avisos legais

- O Consol **não contém** ROMs, ISOs, jogos ou chaves de nenhum tipo. ROMs e discos devem ser cópias que você possui legalmente.
- Os recompilados de jogos pertencem aos seus desenvolvedores (licenças variadas, em sua maioria de código aberto); o RecompLauncher baixa cada um do GitHub oficial do respectivo desenvolvedor. Verifique a licença de cada recomp.
- Consol é um projeto de fãs, não afiliado à Valve, à Nintendo, à Sony, à Microsoft nem a qualquer detentor de direitos.
- "Steam" é marca da Valve Corporation. "Bazzite" é do projeto Universal Blue. Ver `CREDITS`/licenças em cada componente.

## Licença

A camada de integração do Consol (scripts, configurações) é GPL-3.0-or-later. A imagem herda as licenças de todos os componentes incluídos (Bazzite, Fedora, RPMs e Flatpaks).
