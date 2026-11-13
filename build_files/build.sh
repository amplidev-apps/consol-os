#!/bin/bash

set -ouex pipefail

# Copia o conteúdo de system_files/ do repositório para /
cp -avf "/ctx/system_files"/. /

### RecompLauncher (recompilados da comunidade)
# Versão e SHA-256 fixados. Para atualizar:
#   1. Pegue o asset amd64.AppImage da release mais recente em
#      https://github.com/elripalda/RecompLauncher/releases
#   2. Use o campo `digest` do asset na API do GitHub (é o SHA-256 oficial)
#      ou confira o hash listado na página da release.
RECOMP_VERSION="0.90.0-beta.41"
RECOMP_URL="https://github.com/elripalda/RecompLauncher/releases/download/v${RECOMP_VERSION}/RecompLauncher_${RECOMP_VERSION}_amd64.AppImage"
RECOMP_SHA256="890b5830fba456f9099bb77589b42ff8d4581c29aaeba753c40fd67b956b73e1"

mkdir -p /usr/lib/consol
curl -fSL --retry 3 -o /usr/lib/consol/RecompLauncher.AppImage "${RECOMP_URL}"
echo "${RECOMP_SHA256}  /usr/lib/consol/RecompLauncher.AppImage" | sha256sum -c -
chmod 0755 /usr/lib/consol/RecompLauncher.AppImage

# Wrapper: permite rodar a AppImage sem FUSE
install -Dm755 /ctx/recomplauncher.sh /usr/bin/recomplauncher

### Emulação nativa
# RetroArch a partir dos repositórios habilitados na imagem (Fedora/RPMFusion)
dnf5 install -y retroarch

# TODO (v0.2): RetroDECK via Flatpak no kickstart/pós-instalação,
# branding completo (os-release, logo KDE, welcome), tema SDDM.
