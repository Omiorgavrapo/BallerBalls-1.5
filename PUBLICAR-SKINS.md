# Publicar a revisão pastel

Revisão publicada e verificada em https://baller-balls.onrender.com.
Commit de runtime: 98fc720243e993462053617bb50616e7411ab602.
Deploy Live: dep-db81i5mq1p3s7397hp9g. Instruções abaixo servem para
republicar este pacote ou continuar uma próxima atualização.

O pacote local está preparado para o mesmo servidor e protocolo 9.
Para atualizar o site existente, substitua juntos estes quatro arquivos:

- app.js
- render.js
- skin-art.js
- skin-textures.js

As imagens já estão incorporadas em skin-textures.js; não é preciso
subir as pastas de originais para jogar online.

Destino: branch `codex/server-raster-skins` de
[Omiorgavrapo/BallerBalls-1.5](https://github.com/Omiorgavrapo/BallerBalls-1.5/tree/codex/server-raster-skins).
[Tela de upload dos arquivos](https://github.com/Omiorgavrapo/BallerBalls-1.5/upload/codex/server-raster-skins).

Depois de confirmar o commit, no
[serviço atual do Render](https://dashboard.render.com/web/srv-db7ajb2d0e5s73ft4m5g)
escolha **Manual Deploy → Deploy latest commit**. O deploy automático
está desligado. Mantenha o plano Free atual.

Após **Live**, recarregue o jogo e confira: paletas diferentes por skin,
detalhes preservados ao trocar a cor principal, restauração das cores e
arcos voltados para a direção do tiro.
O servidor atual segue em https://baller-balls.onrender.com.

Esta revisão passou também nos testes contra o site público: cores,
salvamento, layout móvel, seletor e cinco jogadores por WebSocket.
