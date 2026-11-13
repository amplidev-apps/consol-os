# Consol OS — Pacote de identidade visual v0.1

Direção aprovada: Conceito 01 (Nexus) — arcos concêntricos e núcleo geométrico.

## Paleta oficial
- Verde principal: `#107C10`
- Verde de destaque: `#9BF00B`
- Fundo principal: `#0A0A0A`
- Fundo secundário: `#161616`
- Texto primário: `#EEEEEE`
- Texto secundário: `#8ED08E`

## Organização
1. `01-logo/`: símbolo vetorial editável e exportações transparentes, versões colorida e branca; wordmark vetorizado (letras convertidas em caminhos SVG)
2. `02-wallpapers/`: wallpapers 1920×1080, 2560×1440 e 1366×768
3. `03-app-icon/`: ícone 512×512 com tile
4. `04-github/`: banner README 1600×500
5. `05-boot-login/`: fundo SDDM 1920×1080, marca Plymouth 200×200 e barras 400×8
6. `06-installer/`: lateral Anaconda 600×800
7. `07-platforms/`: social preview 1280×640, avatar 460×460 e ícone AppStream
8. `previews/`: índice de visualização

Todos os elementos gráficos incluem fontes SVG originais (exceto PNGs de escalas alternativas, derivados da mesma fonte). Os PNGs coloridos de símbolos e o watermark têm transparência; wallpaper, banner, SDDM, avatar e sidebar têm fundo.

## Observações de implementação
- O gráfico-base é vetorial, feito com curvas e caminhos editáveis; não é uma imagem raster colocada dentro de um SVG.
- Os textos no wordmark estão convertidos em paths e não dependem de fontes instaladas no dispositivo.
- O wallpaper não altera a interface Steam Big Picture.
- Plymouth exige configuração própria do tema, usando as barras exportadas; não basta copiar PNGs.
- O fundo de SDDM mantém a região central livre para o formulário de login.
- O visual foi criado como identidade original; antes de publicar recomenda-se uma pesquisa de conflitos de marca e testes em telas reais.
- **Não é uma integração automática na ISO**: o agente deve copiar e referenciar os assets nos caminhos apropriados e testar.
- Os formatos de contêiner e metadados de GHCR/ArtifactHub dependem das ferramentas de publicação; o arquivo fornecido é a arte-base para essas plataformas.

## Implantação
Extraia este ZIP em `M:\Consol\consol\brand\` e peça ao agente para mapear os arquivos no build, sem substituir arquivos do sistema sem backup.
