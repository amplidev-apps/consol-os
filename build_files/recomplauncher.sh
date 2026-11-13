#!/bin/bash
# Wrapper do RecompLauncher (AppImage).
# APPIMAGE_EXTRACT_AND_RUN=1 faz a AppImage extrair em vez de montar via FUSE,
# funcionando em ambientes sem FUSE configurado.
export APPIMAGE_EXTRACT_AND_RUN=1
exec /usr/lib/consol/RecompLauncher.AppImage "$@"
