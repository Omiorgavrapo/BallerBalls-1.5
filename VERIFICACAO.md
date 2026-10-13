## Publicação gratuita e skins PNG — 13/10/2026

- 30 bolinhas (10 refeitas + 20 novas) e 6 arcos gerados pelo image_gen, em cinza com alpha. Originais preservados; 764.402 bytes nas 36 texturas otimizadas.
- Protocolo 9. check-raster-skins.cjs passou localmente e no site publicado: transparência, cor efetiva, 108 variantes, cache de 96 imagens, salvamento, arquivo offline e layout móvel. Prévias não usam Canvas.
- Correção do lag: cartões e PNGs reutilizados; apenas a prévia muda de cor; miniaturas em cinza, carregadas sob demanda; blur e arena animada suspensos na tela de aparência. Benchmark no mesmo desktop: 30 mudanças de cor de 346 para 5 ms; 30 seleções de 326 para 20 ms.
- Chrome local com cinco sessões e novas skins: 60 FPS na amostra, sem erros; simulação continua com o dono desconectado. Três horas simuladas e seis modos aprovados novamente.
- Publicação Render Free concluída: [https://baller-balls.onrender.com](https://baller-balls.onrender.com). Plano US$ 0, Virginia, quatro salas. Google não recebeu upgrade.
- check-deployed.cjs: cinco jogadores reais por WebSocket pela internet, texturas novas, retomada do dono, estados ordenados e remoção da sala criada pelo teste. Pings 154/169/159/172/166 ms nesta rede.
- O plano gratuito pode adormecer, atingir cotas ou reiniciar. Reiniciar perde a partida em memória. Resultados antigos abaixo são históricos.

## Servidor dedicado — 13 de outubro de 2026

Versão 3/protocolo 8. A interface carrega server-client.js, sem carregar
pin.js, online.js, lan.js ou lan-room.js. O processo Node executa a física e
valida o placar. Os testes antigos abaixo registram a arquitetura anterior.

- check-server.cjs: três horas simuladas, sem corte aos 45 minutos; seis modos
  com cinco participantes; servidor não guarda histórico de replay; comandos
  antigos não substituem novos e comandos sem atualização são liberados;
  clientes não podem publicar estados nem inventar placares; falha de física
  em uma sala não encerra as demais.
- Sessão recupera a mesma vaga, sem duplicar jogadores; um socket antigo
  não desconecta seu substituto. A aba do dono não governa o relógio. O dono
  sair transfere os controles e mantém a partida. Entrada tardia assiste.
- PINs de uso único expiram em cinco minutos; salas, PINs e sessões foram
  removidos após 50 ciclos de criação/saída e após expirar vagas desconectadas.
- WebSocket real: dois clientes, retomada com token, fila de saída limitada a
  128 KiB, HTTP só entrega arquivos públicos da interface, Origin malformado
  não derruba o processo.
- check-server-client.cjs: clientes conectados de verdade, simulação avançando
  sem chamar update() do dono; teclas enviadas sem aguardar um frame; queda e
  reconexão automática preservando a mesma identidade e tela; transferência
  de administração e limpeza de timers/sessionStorage ao sair.
- check-server-browser.cjs: cinco sessões isoladas no Chrome, PIN diferente
  por convidado, teclado real, dono desconectado, dono recarregado recuperando
  a vaga, transferência de dono e partida offline pelo arquivo. Sem erros de
  página ou requisições ao Firebase. Amostra de 1,5 s: 54 FPS neste desktop com
  cinco sessões abertas; não mede Chromebook nem redes distintas.
- check-core.cjs, check-rules.cjs, check-prediction.cjs e check-cosmetics.cjs:
  aprovados, preservando modos, colisões, regras, mapas, replay local e aparência.

**Publicação pendente:** o console do projeto bonk-98544 mostrou plano Spark
gratuito. O banco não executa o servidor Node. Cloud Run precisa de
faturamento habilitado pelo dono. Nenhum plano foi alterado e nenhum serviço
pago foi ativado. Não houve teste de latência em redes físicas diferentes.

Cloud Run pode fechar sockets no timeout e o cliente retoma no mesmo
processo. Reiniciar o processo perde as partidas em memória. Publicação usa
uma única instância; não suporta distribuir salas entre múltiplos processos.
O servidor limita a recuperação de física a seis passos por iteração.

## Redesenho em SVG — 11 de outubro de 2026

- Novo método em skin-art.js: SVGs feitos à mão, com máscara de cor e camada de detalhes. Imagens são decodificadas uma vez antes da inicialização da interface. Sprites coloridos são reutilizados no Canvas; cache limitado a 128 combinações. Sem fetch de imagens, dependências novas ou imagens geradas por IA.
- Grid, Piloto e Sentinela mantêm as silhuetas e o visual aprovado. Carinha, Garimpeiro, Camisa 10, Match Point, Arcano, Draco, Autômato e os seis arcos foram refeitos. Carinha usa olhos pequenos, sorriso simples sem dentes e uma variante de detalhes claros para cores escuras. Inspeção visual em raio 44 e raio real de 16 px, sobre a paleta escura.
- check-skin-art.cjs: 48 variantes de SVG/cor carregadas pelo arquivo com rede bloqueada, sprites reutilizados, redesenho após descarte do cache consistente, contraste da Carinha escura e nenhuma imagem nova criada durante renderização. Pequena tolerância de 2 níveis por canal cobre arredondamento de antialias do navegador. Nenhum erro de página/carregamento ou requisição remota.
- Chrome por arquivo: dez opções de bolinha e seis de arco, duas cores independentes, prévias, duas escolhas locais, salvamento/reabertura, migração das sete opções removidas e telas em 683×384 e 390×844 aprovados. Testes cosméticos de 60 combinações e testes de salas aprovados.
- Firebase/WebRTC reais: duas sessões de Chrome neste PC receberam as mesmas skins/cores, cinco participantes, comandos/soltura, desconexão/reconexão, previsão, disparo antecipado, recarga e reserva HTTPS após fechar WebRTC aprovados. Sem erros de página. Mediana de resposta de 36,5 ms em oito amostras; dado do ambiente de teste, sem promessa para outras redes.
- core.js, prediction.js, online.js, lan-room.js, firebase.rules.json, maps.js e historical-maps.js conferidos por SHA-256 contra baller-balls-catalogo.zip: todos idênticos. Esta mudança não altera física, mira, controles, protocolo, salas, mapas ou formato dos perfis. Protocolo permanece versão 7; clientes v7 anteriores continuam compatíveis, mas mostram a arte que possuem. Para todos verem a arte nova, atualizem a pasta inteira, incluindo skin-art.js. Firebase não exige mudança.
- Não foi testado em Chromebook ou entre dispositivos físicos em redes diferentes.

## Catálogo vetorial e cor independente do arco — 11 de outubro de 2026

- Oito bolinhas novas (Sentinela, Garimpeiro, Grid, Camisa 10, Match Point, Arcano, Draco e Autômato) e dois arcos novos (Blocos e Espinha de dragão). Carinha refeita com curvas próprias, olhos/pupilas proporcionais, sorriso e detalhes legíveis em tamanho pequeno; Piloto preservada com acabamento revisado. Dez bolinhas e seis arcos no catálogo atual.
- Sete opções antigas retiradas do catálogo, dos bots, demos, padrões e desenho. IDs antigos são reconhecidos somente para migração para Carinha. Migração testada para os sete casos, conservando apelido, cor, controles, número de bots e vitórias. Mapas e salas não foram removidos do armazenamento/banco.
- Desenhos vetoriais feitos no Canvas, com Path2D reutilizado; sem imagens geradas ou texturas aleatórias. Sentinela mantém a cor principal escolhida, visor dourado e detalhes contrastantes. Blocos usa uma silhueta de arco formada por degraus explícitos. Captura de catálogo inspecionada em raio 44 e em raio 16, com cores escuras, claras e saturadas.
- Novo campo cosmético bowColor; segue perfil, estado, snapshot, replay e previsão. Nas configurações antigas, começa com a cor da bolinha. Seletores independentes e prévia ao vivo. Comparação de pixels confirmou que mudar uma cor não modifica o outro equipamento.
- check-cosmetics.cjs: 60 combinações, replay/previsão, migração, nome/cor preservados e validação de IDs/cores aprovados. check-room.cjs inclui envio das skins/cores aos participantes, perfil antigo sem arco e rejeição de cor remota inválida. Núcleo, regras, previsão e transporte online também aprovados.
- Comparação direta com core.js do ZIP anterior baller-balls-skins.zip: constantes e faixas dos ajustes iguais; todo estado da partida, excluindo apenas campos cosméticos, idêntico a cada um de 360 ticks nos seis modos. Não foram alteradas colisões, mira, velocidade, gravidade ou recarga.
- Chrome por arquivo, com rede bloqueada: catálogo, escolhas dos dois jogadores, cores independentes, salvamento/reabertura, migração das sete opções, partida local, prévias e controles alcançáveis em 683×384 e 390×844 aprovados. Verificação de criação/teclado em cinco tamanhos de tela aprovada. Sem erros JavaScript ou recursos externos no local.
- Firebase e WebRTC reais, duas sessões de Chrome neste PC: host Sentinela/Blocos e convidado Carinha/Espinha de dragão, com cores distintas do arco, recebidos corretamente nos dois lados. Cinco participantes, comandos, soltura, saída/reconexão, previsão com estados retidos, tiro antecipado, mira/recarga e queda para reserva aprovados. Mediana medida de resposta: 36 ms em oito amostras. Dados de teste limpos ao finalizar.
- Protocolo online versão 7. Todos precisam extrair os arquivos novos; clientes antigos recebem aviso de incompatibilidade. Regras Firebase preservadas. Redes físicas distintas e Chromebook continuam sem teste.

## Tema escuro e skins — 11 de outubro de 2026

- `theme.css`, carregado após os estilos existentes, compartilha a paleta escura do início com criação local, salas, janelas, mapas, configurações, HUD e editor. Campos e controles nativos usam esquema escuro; badges, textos auxiliares e mira foram ajustados para manter contraste. As cores dos mapas são dados do autor e permanecem preservadas.
- Quatro novas bolinhas: Quadra, Bola 8, Costura e Piloto. Três novos arcos: Recurvo, Mecânico e Meia-lua. Total: nove bolinhas e quatro arcos. Desenhos feitos com traços no Canvas, sem imagens externas, CDN ou dependências novas. A cor do jogador tinge a base e os detalhes do arco, mantendo costuras, visor e painéis contrastantes.
- Janela Aparência com seleção independente, prévia do conjunto, abas acessíveis pelo teclado, cor base e escolha de jogador. A criação local abre a mesma janela; escolhas do jogador 2 são independentes. Avatar no topo e na sala usa o desenho da bolinha. Configuração salva neste navegador e enviada ao entrar no online.
- Catálogos e validação em `core.js`; `bowSkin` acompanha perfil, estado, snapshot/replay e previsão. IDs desconhecidos são rejeitados no núcleo e na entrada online. Perfis anteriores sem arco recebem Madeira. Protocolo de convite versão 6 impede conexão com clientes que não conhecem as skins.
- `check-cosmetics.cjs`: 36 combinações bolinha/arco, replay, previsão, padrões antigos e IDs inválidos aprovados; a física permanece igual em 120 ticks por modo, nos seis modos. `check-core.cjs`, `check-rules.cjs`, `check-room.cjs`, `check-prediction.cjs`, `check-online.cjs`, `check-hybrid.cjs` e `check-baller.cjs`: aprovados. O teste da sala inclui cosméticos no host e convidados.
- Chrome por arquivo, com rede bloqueada: superfícies escuras em todas as telas, desenhos e variação de cor, escolha dos dois jogadores, persistência após recarregar, partida local e aparência em 683×384 e 390×844 aprovados. A verificação anterior de controles/criação em cinco tamanhos de tela também passou. Capturas de skins, sala, criação, modos, mapas, configurações e editor inspecionadas. Nenhum erro de página ou requisição externa no local.
- Chrome com Firebase real e WebRTC: host com Quadra/Recurvo, convidado com Piloto/Mecânico, cosméticos recebidos iguais nos dois lados, cinco participantes, comandos/soltura, saída/reconexão, previsão com estados retidos, tiro antecipado/recarga e retorno à reserva após queda aprovados. Mediana de resposta medida: 35,5 ms em oito amostras no mesmo PC. Dados de teste limpos ao finalizar.
- Regras Firebase preservadas. Duas redes físicas distintas e Chromebook continuam sem teste; o visual novo também não foi medido nesse aparelho.

## Baller Balls, mapas e controles — 11 de outubro de 2026

- Tela inicial renomeada para Baller Balls. Seletores local e online com busca, filtro, miniaturas, prévia grande, detalhes e confirmação. Prévia limpa de marcadores técnicos de edição.
- Catálogo com 33 entradas: sete novas arenas autorais, incluindo plataformas verdes de impulso. Editor cria, configura, gira e exporta esses blocos; contato na face superior lança jogadores e a bola do Football.
- Cima/baixo agora giram a mira em Arrows e Death Arrows, além de esquerda/direita. WASD funciona também para o jogador único local e online com direções padrão, sem compartilhar teclado quando há dois humanos locais.
- Comparação da física padrão 1× contra o núcleo do pacote anterior aos controles personalizados (`bonk-local-lan.zip`): constantes idênticas e posição/rotação dos jogadores iguais a cada tick por 360 ticks em cada um dos 26 mapas anteriores. A mira antiga foi excluída da comparação pois sua rotação foi alterada intencionalmente. Também foram comparadas trajetórias de flechas sem alterar a direção da mira nos dois modos de tiro: 48 amostras de posição/ângulo idênticas, confirmando a velocidade padrão nesses disparos. Não se reproduziu diferença física nesses cenários; isso não comprova fidelidade ao Bonk.io original. Cada mapa tem gravidade própria e o local pode conservar ajustes salvos. A prévia agora informa a gravidade do mapa.
- Testes do núcleo, regras, sala, convites, transporte, conexão direta/reserva e previsão aprovados. `check-baller.cjs` cobre contato com plataforma de impulso, validação/importação, giros de mira, impulso na bola do Football e replay reproduzível do contato. `check-prediction.cjs` inclui agora explicitamente todos os mapas históricos, totalizando 33.
- Chrome por arquivo, sem rede: marca, seis cartões de modo, busca/prévia/confirmação, W/S com teclado real, seletor da sala, desenho do bloco no editor e controles alcançáveis em 683×384 e 390×844 aprovados; sem erros JavaScript.
- Chrome por arquivo com Firebase e WebRTC reais: cinco participantes, controles/soltura, saída/reconexão, previsão com estados do host retidos, tiro antecipado e queda para a reserva aprovados. Oito amostras de resposta no convidado tiveram mediana de 36 ms nesta execução. Ambas as sessões estavam no mesmo PC; redes físicas distintas e Chromebook continuam sem teste.
- Protocolo online atualizado para versão 5: todos precisam extrair a pasta nova inteira. Regras Firebase preservadas.

# Verificação da entrega

## Previsão no cliente e reconciliação — 10 de outubro de 2026

- O convidado executa uma instância da mesma física `BonkCore` a 60 Hz. Movimento, mira, disparo e chute no Football têm resposta visual antes de receber novos estados. Apenas o jogador local, seus tiros e a bola de Football usam a previsão; os demais jogadores continuam interpolados.
- Os estados incluem velocidades, recargas, dados do gancho e confirmações dos comandos processados. O cliente aplica o estado autoritativo e reaplica os comandos pendentes. Confirmações cumulativas descartam cada passo uma vez. Pequenas diferenças na bolinha, tiros e bola convergem em vez de saltar no recebimento; grandes diferenças, mortes e mudanças de rodada corrigem a previsão imediatamente. Placar e resultados continuam vindos do host.
- A previsão tem limite de 90 passos pendentes (1,5 segundo). Não usa o replay integral da rodada nem guarda um histórico crescente. A correção ao vivo não restaura os impulsos internos de contato do host: é uma estimativa corrigida, sem garantia de igualdade física exata entre máquinas.
- `check-prediction.cjs`: aprovado. Movimento e disparo sem resposta do host, comandos pendentes reaplicados, confirmação cumulativa/repetida, ausência de tiros duplicados, colisão com o chão, seis modos com regras personalizadas, chute e bola previstos, correções suaves da bolinha e tiros, morte/rodada autoritativas, limite durante interrupção e rejeição de velocidades inválidas antes de alterar a simulação. Todos os 26 mapas aceitaram previsão e correção. Benchmark no desktop: 260 correções com passos locais em aproximadamente 31 ms; não é medição em Chromebook.
- `check-core.cjs`, `check-rules.cjs`, `check-room.cjs`, `check-online.cjs`, `check-pin.cjs` e `check-hybrid.cjs`: aprovados após a inclusão da previsão. O núcleo local continua com replay exato no mesmo runtime; regras, mira e mapas conservaram os testes anteriores.
- Chrome com Firebase real: modos direto e de reserva aprovados. Nos dois caminhos, o teclado moveu a bolinha e desenhou um tiro enquanto todos os novos estados do host eram retidos propositalmente pelo teste. A sala também passou por saída/reconexão; fechar o canal direto manteve a reserva e os comandos. A medição final da reserva confirmou mediana de 666,5 ms para a confirmação do comando: a previsão oferece resposta local antes dessa confirmação, sem reduzir artificialmente a medição do banco. A medição foi movida para mira estacionária sem bots, pois uma tentativa anterior expirou depois que o jogador de teste morreu durante as amostras.

O protocolo de convites agora exige esta versão com confirmações de comandos. Todos devem atualizar a pasta inteira; as regras Firebase continuam iguais. Os testes online usam duas sessões no mesmo PC. Duas redes físicas diferentes e Chromebook continuam sem validação. A previsão não elimina uma falha de rede nem permite antecipar comandos desconhecidos de um adversário; acertos e placar precisam de confirmação.

## Correção dos saltos no convidado — 10 de outubro de 2026

- O convidado recebia estados por HTTPS com atrasos variáveis. A interpolação também reiniciava a partir de um estado bruto, produzindo um salto quando o pacote seguinte chegava antes de completar o movimento. Agora ela parte da posição já exibida e ajusta a duração ao intervalo dos estados. O teste injeta intervalos de 20, 85, 30, 170 e 45 ms e confere continuidade no instante de cada recepção.
- A sala negocia WebRTC global automaticamente pelo Firebase. Estados e comandos usam a conexão direta quando disponível; convites, mapa, início e controle continuam pelo banco. Falha, bloqueio ou queda do canal direto mantêm a reserva HTTPS. Não há opção LAN nem códigos longos na interface; o PIN continua com oito dígitos. O HUD identifica **Direta** ou **Via banco**.
- Estados são enviados até 20 vezes por segundo, sem repetir a geometria e propriedades dos objetos do mapa. Mudanças de tecla saem no primeiro frame. A reserva envia comandos imediatamente quando possível e despacha o próximo lote assim que a escrita anterior termina, sem acrescentar outra espera fixa.
- `check-room.cjs`, `check-online.cjs`, `check-pin.cjs`, `check-lan.cjs` e `check-hybrid.cjs`: aprovados. O teste híbrido inclui negociação global, mensagens grandes/Unicode fragmentadas, controle preservado no banco, descarte sob pressão de buffer, queda para a reserva e WebRTC indisponível.
- Chrome real, duas sessões abrindo o HTML por arquivo com Firebase real: modo direto aprovado, inclusive fechamento forçado do canal WebRTC mantendo a sala e os comandos pela reserva. Modo de reserva aprovado separadamente, incluindo cinco participantes, soltura, saída, reconexão, regras personalizadas e disparo/recarga em Arrows. Sem erros JavaScript não tratados.
- Foram medidos oito comandos alternados por execução, desde a tecla até o comando confirmado no estado recebido pelo convidado. No pacote anterior, a mediana foi **621 ms**; em duas execuções do canal direto, **37,5 ms** (35–67 ms) e **35 ms** (35–57 ms), esta última com os arquivos finais. Essa medida não inclui o tempo da interpolação até o pixel final e não representa duas redes físicas distintas. Na reserva atual, a mediana foi **534 ms**, com uma interrupção de rede de **4.633 ms** em uma amostra: o banco continua sendo um limite material de latência.
- Verificação local sem rede aprovada em 1366×768, 900×600, 701×600, 683×384 e 390×844, incluindo configurações, persistência, teclado, mira e Esc. Nenhuma alteração na física dos modos ou nas regras Firebase foi necessária para esta correção.

Todos devem extrair a pasta atualizada inteira. O arquivo `firebase.rules.json` continua igual ao pacote anterior, cujas regras já foram publicadas. Os testes usaram sessões no mesmo PC, sem confirmação em dois aparelhos físicos, redes diferentes ou Chromebook. Redes que bloqueiam WebRTC podem continuar atrasadas pela reserva; um serviço TURN seria necessário para melhorar esse caminho. Nenhum serviço pago foi contratado ou ativado.

## Interface, regras de partida e arco — 9 de outubro de 2026

- Criação local e online compartilha os quatro controles: gravidade, tamanho dos jogadores, velocidade do tiro e tempo de vida do tiro. Valores são validados no núcleo e ao receber dados online; só o anfitrião altera regras da sala. O local salva seus ajustes neste navegador e oferece restauração dos padrões.
- Mira contínua em ambos os sentidos, inclusive durante a recarga. Arco, corda, flecha e indicador circular desenhados no Canvas. No convidado, mira e recarga são interpoladas; a passagem de ângulos entre −180° e 180° segue o caminho curto, corrigindo uma rotação visual invertida de flechas.
- Corrigido o raio fixo do convidado: a renderização usa o tamanho definido pelo anfitrião. Esc agora fecha uma janela mesmo com um campo focado e devolve o foco ao Canvas; pausa e teclado continuam no estado esperado.
- Interface local, sala, janelas, prévias de mapas, HUD e editor usam a mesma paleta, cantos, espaçamentos e contraste. Textos principais da criação e configurações em português. Telas altas têm rolagem; controles foram alcançados em 1366×768, 900×600, 701×600, 683×384 e 390×844.
- `node check-core.cjs`: aprovado nos seis modos, bots, 26 mapas e replay existente. `node check-rules.cjs`: aprovado com gravidade zero/invertida, colisão no tamanho escolhido, bola de Football preservada, duas rotações completas de mira, recarga, velocidade real, expiração do tiro, trajetória e replay com regras personalizadas. Os 26 mapas também passaram 360 ticks em duas combinações extremas dos ajustes com oito participantes.
- `node check-room.cjs`, `node check-online.cjs` e `node check-pin.cjs`: aprovados. A sala inclui regras compartilhadas, impedimento de alteração pelo convidado, tamanho sincronizado, interpolação angular e recarga. Transporte e PIN mantêm os testes anteriores.
- Chrome abrindo `file://`: jogo local sem nenhuma requisição de rede; campos válidos/inválidos, padrões, persistência, teclado de mira/disparo, arco/recarga, fechamento de janela por Esc e movimento após fechar. Capturas de criação, mapa, configurações e editor inspecionadas.
- Chrome com Firebase real e WebRTC desativado: dois humanos e três bots, opções personalizadas iguais nos dois lados, teclado, soltura, saída/reconexão. Uma segunda sala em Arrows confirmou comandos do convidado, carga, disparo e recarga nos dois lados; capturas do arco e recarga inspecionadas. Sem erros JavaScript não tratados ou serviços externos inesperados.

O protocolo do pacote foi atualizado para impedir partidas com clientes antigos que ignoram as novas regras. Todos devem extrair a versão nova. `firebase.rules.json` foi preservado; o proprietário já publicou suas regras na etapa global anterior. Os testes online continuam em duas sessões no mesmo PC usando o banco real, sem teste em dois aparelhos físicos ou Chromebook. Isso não comprova ausência de todo bug possível, fidelidade exata ao original ou latência/cota sob carga pública.

## Atualização global — 9 de outubro de 2026

- O proprietário publicou as regras novas de `connections` e `invites`. A configuração continua apontando para `bonk-98544`.
- `node check-online.cjs`: aprovado. Transporte HTTPS, eventos SSE fragmentados, Unicode, sequência, estados/comandos substituídos na fila, preservação de valores nulos, limite de tamanho, desconexão e permissões de leitura/escrita avaliadas a partir das regras reais em uma fixture local.
- `node check-pin.cjs` e `node check-room.cjs`: aprovados. Convites automáticos, cancelamento, lotação, comandos, validação de mensagens, soltura por inatividade, saída, partidas novas e espectadores.
- `node check-browser.cjs`: aprovado no Chrome, abrindo `index.html` por `file://`, com Firebase real e `RTCPeerConnection` explicitamente desativado. Dois humanos e três bots; estados/rodadas sincronizados, teclado do convidado chegando à física do dono, soltura, saída detectada e reconexão com novo PIN. Sem erros JavaScript nem requisições para serviços inesperados.
- Capturas do menu, sala e partida inspecionadas; botões, títulos e mensagens não usam mais LAN. O transporte WebRTC antigo deixou de ser carregado pelo jogo.
- O ZIP global foi comparado por SHA-256 aos arquivos de distribuição.

Os dois navegadores de teste rodaram neste PC. O trajeto usou o banco real pela internet, sem ligação local direta, mas ainda falta confirmar em dois aparelhos físicos de redes diferentes e em Chromebook. Não foram medidos consumo mensal de cota, latência geográfica, carga pública ou uma sessão completa de 45 minutos. O Firebase agora carrega também a partida; o atraso e a cota de transferência são limites materiais desta implementação. Listagem pública de salas e biblioteca pública de mapas não foram adicionadas.

## Histórico: configuração inicial Firebase — 9 de outubro de 2026

- `online-config.js` preenchido para o projeto `bonk-98544`, com a chave pública informada pelo proprietário.
- Acesso REST ao Firebase real aprovado: autenticação anônima de anfitrião e convidado, criação de PIN com oito dígitos, leitura da oferta, gravação/leitura da resposta e recusa de segunda resposta.
- As regras publicadas recusaram listar todos os convites e apagar um convite por outro usuário. O convite e as duas identidades do teste completo foram removidos ao terminar.
- Este teste usou ofertas/respostas de verificação, sem iniciar uma partida. A integração completa no Chrome foi verificada anteriormente com Firebase simulado; ainda falta jogar em dois aparelhos reais na mesma rede.

## Atualização PIN + interface — 8 de outubro de 2026

- `node check-pin.cjs`: aprovado. Oito dígitos/zeros iniciais, colisão, uso único, expiração, cancelamento, limpeza, rede indisponível e expressões das regras incluídas, com REST simulado.
- `node check-room.cjs`: aprovado com PIN automático e ligações simuladas; configuração, capacidade, comandos, espectadores, desconexão, reconexão e dados inválidos.
- `node check-browser.cjs`: aprovado no Chrome com páginas `file://`, Firebase simulado e WebRTC real. Dois humanos e três bots, teclas, soltura, desconexão e conexão com novo PIN. Sem erros JavaScript nem requisições inesperadas.
- Menu, sala e formulário de PIN foram inspecionados em capturas do Chrome. Verificação em 1366×768, 900×600, 701×600, 683×384 e 390×844: controles acessíveis, rolagem, lobby offline, zeros iniciais e erro sem configuração. A sala mostra a prévia do mapa, humanos, vagas livres e bots em painéis separados.

Na entrega de 8 de outubro, o projeto Firebase ainda não estava configurado. A configuração e os testes REST no projeto real foram concluídos em 9 de outubro, como descrito acima. Ainda falta validar dois aparelhos e um Chromebook. O modo local funciona sem acesso ao Firebase.

## Histórico: etapa LAN anterior — testes efetivamente realizados

- `node check-core.cjs`: aprovado, incluindo cinco humanos nos seis modos e os testes locais existentes com dois humanos mais seis bots.
- `node check-lan.cjs`: aprovado. Códigos de conexão, fragmentação, Unicode, limite de 1 MiB por objeto, pressão de buffer, mensagens inválidas, prazo de montagem e limpeza de conexões.
- `node check-room.cjs`: aprovado com mapas e física reais, ligações simuladas. Lotação, divisão humanos/bots, propriedade dos comandos, sequência/frequência, soltura por inatividade, entrada como espectador, saída de jogadores, novas partidas e rejeição de placar malicioso.
- `node check-browser.cjs`: aprovado com duas sessões de Chrome, abrindo `index.html` por `file://`. Convite/resposta WebRTC reais, dois humanos mais três bots, comandos do convidado na física do anfitrião, soltura de teclas, saída e conexão com novo convite. Sem erros JavaScript não tratados nem requisições de página para serviços externos. Capturas da sala e da partida foram inspecionadas.

O navegador precisou executar fora da sandbox de desenvolvimento porque esta impedia sua inicialização. A sandbox do Chrome permaneceu habilitada. Os dois participantes do teste rodaram **no mesmo PC**: não houve teste em dois aparelhos, no Wi-Fi do usuário ou em Chromebook. Isolamento de rede, firewall, políticas do Chrome e desempenho do aparelho continuam pendentes. O anfitrião deve manter a aba visível; sair encerra a sala.

Na etapa LAN anterior, nenhum banco ou serviço de nuvem era usado. A versão PIN intermediária usou Firebase só para os convites. A distribuição global atual também transmite a partida pelo banco, sem SDK externo. A biblioteca pública pela internet fica para outra etapa.

## Verificação original — 7 de outubro de 2026

### Aprovado no ambiente disponível

Windows, Node v24.19.0, Planck 1.4.2 incluído. `node check-core.cjs` passou.

- Contato com plataformas, pulo, penalidade de controle no pesado e colisão contínua: um círculo a 10.000 px/s não atravessou uma plataforma de 1 px.
- Seis modos, bots usando flechas/gancho/chute, até dois humanos mais seis bots, transições de rodada, eliminação, placar, gols, empates e reinício.
- Geometria côncava, junta motorizada, zonas filtradas por time e estados numéricos finitos.
- 26 entradas de mapa, IDs únicos e cobertura dos seis modos. Todos passaram validação, ida e volta em JSON e 600 ticks com oito participantes por mapa.
- Snapshot/restauração e evolução posterior iguais no mesmo runtime. Uma sessão de 18.000 ticks cruzou mais de 50 rodadas; o histórico retido ficou limitado à rodada atual. Snapshot com tick inválido foi rejeitado sem alterar estado, pontuação, RNG ou histórico.
- Autoverificação lógica do editor: polígono, seleção de retângulo rotacionado e preservação de propriedades no JSON. Isso não é um teste de cliques na interface.
- Scripts clássicos analisados e dependências locais conferidas. O jogo não contém fetch, XHR, WebSocket, CDN obrigatório nem importação de módulos locais.
- Renderização nativa em Canvas no desktop: fontes locais carregadas, 26 prévias e estados dos seis modos desenhados. Formas grandes respeitam o recorte do mapa, suas cores são preservadas e o contexto de desenho é restaurado. Essa checagem de componentes não é uma captura da interface no Chrome.

O benchmark do núcleo com obtenção de estados executou 10.800 ticks em aproximadamente **0,45 s** neste desktop. Não mede Canvas/DOM, memória total ou FPS no Samsung Chromebook 3.

Foram corrigidos: a unidade do ângulo da bola para o renderizador, o filtro de times nas zonas, o placar de captura no Football, validação antecipada de snapshots e dois problemas de pausa na interface (abrir novamente Settings ao redefinir controles; texto herdado de uma partida anterior).

### Pendências da verificação original

Na entrega original, o navegador de testes não conseguiu carregar a prévia em localhost nem abrir URLs `file://`. O teste LAN de 8 de outubro resolveu a verificação de abertura por arquivo, cliques de conexão e teclado da partida LAN no Chrome deste PC. Importação/exportação pela interface, teclado local simultâneo, alternância de layouts durante partida, perda de foco local e redimensionamento completos ainda precisam de conferência.

O CSS contém adaptações para painéis estreitos/baixos e a arena usa escala uniforme; viewports 1366×768, 1280×720, 1024×600, 1920×1080, retrato e zoom ainda precisam ser conferidos visualmente. Nenhum teste foi realizado em um Chromebook.

Para a primeira conferência no aparelho, extraia o ZIP e abra `index.html` sem rede; jogue uma partida em cada modo, acrescente o segundo humano e seis bots, alterne layouts, teste pausa/perda de foco e exporte/reimporte um mapa editado. Reduza Graphics para Low se necessário. Essa lista descreve pendências, não resultados já aprovados.

A física continua estimada e a aparência/sons/fontes diferem da referência. Publicação de mapas anterior a 2026 comprova existência até 2025, mas não geometria idêntica naquele ano. Detalhes em `REFERENCIAS.md` e `MAPAS.md`.

O ZIP foi extraído para uma pasta de conferência; seu conteúdo foi comparado por SHA-256 aos arquivos de distribuição. A checagem do núcleo foi executada novamente nessa cópia extraída. Isso verifica integridade e execução do código de simulação extraído, sem substituir a abertura visual do HTML.
