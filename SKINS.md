# Skins pastel — 30 bolinhas e 6 arcos

Toda a coleção foi refeita com o image_gen integrado, em gerações individuais.
Tennis e Alien receberam uma segunda tentativa.
Os desenhos usam formas grandes, sem textura, brilho, volume ou contornos
grossos. A adaptação limita cada PNG a cinco cores chapadas, preservando
as formas geradas e a transparência nas bordas.
Tennis usa só duas cores; a adaptação corrige a transparência indevida
no interior do disco retornado pelo gerador, mantendo as faixas creme.

Paleta: lavanda #c7b9ed, sombra lavanda #aa9bd4, creme #fff2da,
rosa #efb6c4 e tinta escura #4d5267. Nem todo desenho usa todas as cores.
Ao escolher uma cor, só lavanda e sua sombra mudam: a parte principal usa
exatamente a cor escolhida, e a sombra recebe 86% de cada canal RGB.
Os detalhes creme, rosa e escuros permanecem intactos. A versão anterior
tingia o desenho inteiro a partir do cinza, fazendo os detalhes perderem
sua paleta; esse filtro foi substituído.

`skin-textures.js` incorpora as 36 miniaturas PNG e suas camadas para funcionar offline.
`skin-art.js` colore máscaras alpha da parte principal e sua sombra; a camada
dos detalhes conserva o RGB original. O filtro soma as três camadas, evitando
bordas com a cor original e transparência indevida ao reduzir a imagem. Há cache
limitado a 96 imagens. A engine e as prévias não criam Canvas para gerar
ou tingir skins; a arena apenas exibe as imagens prontas.

Os originais desta revisão estão em `assets/skins/pastel-generated`,
com prompts completos nos arquivos manifest-*.json. Os originais da
versão anterior foram preservados em `assets/skins/generated`.
Texturas adaptadas: `assets/skins/textures`; inventário, uso da paleta
e hashes: `assets/skins/manifest.json`. Os IDs, escolhas salvas e o
protocolo online 9 continuam compatíveis.
No GitHub, as imagens de execução estão incorporadas em `skin-textures.js`.
Os originais de geração e os manifests completos de prompts ficam na entrega
local e no ZIP de imagens. O teste raster verifica diretamente os PNGs
incorporados, sem precisar extrair as pastas dos originais.

As 36 miniaturas ocupam 175.693 bytes; incluindo as 108 máscaras/camadas,
são 433.763 bytes. O script incorporado ocupa 584.081 bytes (antes: 1.020.577).
`build-skin-assets.cjs` reproduz a adaptação a partir dos originais e requer Sharp.
O pacote de jogo usa os PNGs já preparados; o ZIP de imagens contém os originais.

O seletor reutiliza seus cartões e miniaturas coloridas. Só duas prévias
usam filtros compartilhados, atualizados quando a cor muda. Abrir a tela
de aparência suspende a animação da arena e o blur.
Benchmark desta revisão no Chrome deste desktop: 30 mudanças de cor em 5 ms,
30 seleções em 49 ms. As partidas com cinco clientes e skins diferentes
mantiveram 60 FPS na amostra local. Não é uma medição no aparelho do usuário.

Validação:

- `node check-pastel-color.cjs`: compara pixels realmente renderizados
  no Chrome; troca a cor principal e verifica que os detalhes não mudam.
- `node check-raster-skins.cjs`: cinco cores no máximo, alpha, 108 variantes,
  funcionamento offline, salvamento, ausência de Canvas na engine/prévias,
  cache limitado e layout móvel.
- `node check-skin-performance.cjs`: mede mudanças de cor/seleção e exige
  que os mesmos cartões e imagens sejam reutilizados.
- `node check-cosmetics.cjs`: 180 combinações, persistência e física intacta.
