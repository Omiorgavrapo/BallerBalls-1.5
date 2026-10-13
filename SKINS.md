# Skins geradas — 30 bolinhas e 6 arcos

As dez bolinhas existentes foram refeitas com o gerador de imagens, junto
com os seis arcos. Há vinte bolinhas adicionais: Gato, Panda, Raposa, Coruja,
Tubarão, Pinguim, Sapo, Urso, Fantasminha, Astronauta, Ninja, Samurai, Pirata,
Alien, Coroa, Cristal, Lua, Magma, Nuvem e Slime.

São PNGs reais em cinza, com fundo transparente e volume suave. A cor é
aplicada por um filtro de imagem do navegador, preservando sombras e brilhos.
A engine de skins e a tela de aparência não desenham arte no Canvas. O
Canvas da arena apenas exibe as imagens prontas junto ao restante do jogo.

`skin-textures.js` inclui as 36 texturas em PNG para funcionar até pelo
arquivo, sem fetch nem CDN. `skin-art.js` usa feComponentTransfer para
mapear cinza para a cor escolhida e limita o cache a 96 imagens. `core.js`
mantém os IDs antigos, acrescentando vinte novos. O protocolo online é 9.

Originais em `assets/skins/generated`; texturas otimizadas em
`assets/skins/textures`; inventário e hashes em `assets/skins/manifest.json`.
Os três arquivos manifest-*.json da pasta generated registram os prompts
completos e os caminhos originais retornados pelo gerador. As 36 imagens
foram criadas pelo image_gen integrado, uma chamada por asset. A adaptação
normaliza tamanho, cinza e borda circular, sem redesenhar os detalhes.

`node check-raster-skins.cjs` verifica PNGs com alpha, 108 combinações de
cor, alteração efetiva dos pixels exibidos, ausência de Canvas na engine e
nas prévias, salvamento, arquivo offline, cache limitado e layout móvel.
`node check-cosmetics.cjs` verifica as 180 combinações de bolinha/arco e que
elas não alteram a física.

## Correção de desempenho do seletor

Miniaturas são PNGs estáticos em cinza com carregamento adiado. Só as duas imagens da prévia usam filtros de cor compartilhados. Mudar cor ou equipamento conserva os mesmos cartões e imagens; não refaz a grade nem decodifica trinta novas imagens. A animação da arena e o blur ficam desligados enquanto a aparência está aberta. No mesmo desktop, 30 mudanças de cor passaram de 346 para 5 ms; 30 seleções, de 326 para 20 ms. Não é uma medição no aparelho do usuário.
