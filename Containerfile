# Consol — uma distro Linux focada em jogos, baseada no Bazzite (NVIDIA)
# https://github.com/ublue-os/bazzite

# Permite referenciar os build scripts sem copiá-los para a imagem final
FROM scratch AS ctx
COPY build_files /
COPY system_files /system_files

# Base: Bazzite para NVIDIA (KDE Plasma), inclui driver proprietário
# necessário pela GTX 750 Ti (Maxwell, suportada pelo branch 580.x).
# Para GPUs mais novas, troque por bazzite-nvidia-open.
FROM ghcr.io/ublue-os/bazzite-nvidia:stable

### [IM]MUTABLE /opt
# O Bazzite mantém /opt mutável (symlink para /var/opt). Não alterar.

### MODIFICAÇÕES
# O script build.sh roda com mounts e o conteúdo de system_files/ é
# copiado para / dentro dele.
RUN --mount=type=bind,from=ctx,source=/,target=/ctx \
    --mount=type=cache,dst=/var/cache \
    --mount=type=cache,dst=/var/log \
    --mount=type=tmpfs,dst=/tmp \
    /ctx/build.sh

### LINTING
# Verifica se a imagem final está correta (bootc)
RUN bootc container lint
