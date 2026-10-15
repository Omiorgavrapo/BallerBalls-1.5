# Skins pastel — 30 bolinhas e 6 arcos

Os desenhos desta coleção foram criados individualmente com o image_gen
integrado. A adaptação mantém as formas geradas, o fundo transparente e
no máximo cinco cores chapadas por asset. Os originais continuam preservados.

Cada skin tem uma paleta própria em `skin-palettes.json`: raposa pêssego,
sapo pistache, tubarão azul, urso caramelo, tênis verde-limão, coroa dourada,
entre outras. A paleta registra cor principal, sombra e três cores de detalhes.
As cores lavanda dos arquivos de geração são apenas marcadores de regiões;
nenhuma paleta lavanda global é aplicada ao catálogo final.

Ao escolher outra skin, a cor principal passa a ser a cor original daquela
skin. Clicar na skin já equipada conserva a personalização. O botão
**Cores originais** restaura as cores da bolinha e do arco selecionados.
O seletor de cor continua livre: apenas a parte principal e sua sombra mudam;
os olhos, roupas e acessórios mantêm as cores específicas de cada desenho.
Com a cor original, a sombra também é a original; com uma cor personalizada,
a sombra usa 86% dos canais RGB da cor escolhida.

`skin-textures.js` incorpora as miniaturas coloridas, máscaras PNG, paletas
e medidas dos arcos, para funcionar offline. `skin-art.js` colore apenas
as máscaras da parte principal e da sombra e soma a camada dos detalhes.
Isso preserva as cores e a opacidade das bordas mesmo ao reduzir as imagens.
O cache fica limitado a 96 imagens. A engine de skins e as prévias não
criam Canvas para gerar ou tingir desenhos; a arena exibe as imagens prontas.

Os seis arcos foram espelhados horizontalmente. Na direção de tiro local,
a corda fica atrás das lâminas. A arena alinha os dois pontos da corda às
pontas do PNG, recorta a corda estática do sprite e desenha a corda móvel.
Isso funciona também quando o jogador gira a mira. A corda usa a cor de
detalhe da paleta daquele arco.

Originais e prompts: `assets/skins/pastel-generated`; originais anteriores:
`assets/skins/generated`; PNGs adaptados e máscaras: `assets/skins/textures`.
O inventário, hashes, paletas e pontos de alinhamento ficam em
`assets/skins/manifest.json`. O GitHub contém os PNGs de execução incorporados
no script; a entrega local e o ZIP de imagens conservam os originais e prompts.
`build-skin-assets.cjs` reproduz a adaptação com Sharp e os originais.
IDs, escolhas salvas e protocolo online 9 continuam compatíveis.

Verificação:

- `node check-raster-skins.cjs`: 36 paletas diferentes, cinco cores por skin,
  discos sólidos, conservação de alpha e detalhes, 108 variantes, troca e
  restauração de cor, salvamento, offline, cache limitado e layout móvel.
- `node check-pastel-color.cjs`: compara pixels renderizados no Chrome para
  preservar detalhes, sombra original, bordas e cores personalizadas.
- `node check-bow-orientation.cjs`: valida os seis arcos, orientação, recorte
  da corda estática e alinhamento dos dois pontos da corda no renderizador real.
- `node check-skin-performance.cjs`: grade e imagens reutilizadas; nesta
  revisão, 30 mudanças de cor em 5 ms e 30 seleções em 39 ms no desktop.
- `node check-server-browser.cjs`: cinco clientes com skins diferentes,
  reconexão, transferência da sala, jogo offline e medição local de FPS.
