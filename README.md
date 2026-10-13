# Baller Balls — Local + Servidor online

Jogo local em HTML, CSS e JavaScript, com o Bonk.io de 2025 como referência. **A fidelidade 1:1 visual e física ainda não foi comprovada.** As diferenças e os limites dos testes estão em `VERIFICACAO.md` e `REFERENCIAS.md`.

## Jogar

1. Extraia **todo** o ZIP, mantendo as pastas `vendor` e `assets` junto aos demais arquivos.
2. Abra `index.html` no Chrome. A distribuição usa scripts clássicos e recursos locais; não exige instalação, build, CDN ou servidor para o modo local.
3. Escolha **Jogar local** ou **Criar partida**, configure os participantes e pressione **Iniciar partida**.

No modo local, até dois humanos no mesmo teclado, além de zero a seis bots. Há dois bots por padrão. Bots usam os mesmos comandos e a mesma física dos humanos.

**Online com servidor dedicado:** a física e o placar rodam no processo Node do servidor; até cinco participantes usam PINs de 8 dígitos. O criador da sala joga como os convidados. Leia [SERVIDOR.md](SERVIDOR.md) para executar, testar e publicar. A versão 3.1/protocolo 9 exige esse servidor e não usa o banco Firebase para movimento. A publicação no Google ainda depende da habilitação de faturamento pelo proprietário; não foi efetuada.

Todos os humanos online usam previsão local com reconciliação, incluindo o dono. O servidor confirma física, comandos e resultados; a previsão limita a fila a 30 passos. Os outros participantes usam interpolação. Atualize a pasta inteira; esta versão não conecta a salas antigas baseadas na aba do anfitrião.

## Regras da partida

Nas telas de criação local e online, o painel **Regras da partida** permite ajustar:

| Opção | Intervalo | Padrão |
|---|---|---|
| Gravidade | −3× a 3× da gravidade do mapa; 0 flutua | 1× |
| Tamanho dos jogadores | 0,5× a 2×; altera também a colisão | 1× |
| Velocidade do tiro | 0,25× a 3× | 1× |
| Tempo de vida do tiro | 0,2 a 15 segundos; uma colisão pode encerrá-lo antes | 5 s |

Velocidade e tempo de vida afetam Arrows e Death Arrows. O tamanho não altera a bola do Football. **Restaurar padrão** desfaz os ajustes. No local, as regras ficam salvas neste navegador; no online, o dono escolhe antes de iniciar e todos recebem os mesmos valores. Durante a partida online, os ajustes ficam bloqueados.

## Controles

| Ação | Jogador 1 | Jogador 2 |
|---|---|---|
| Direções | Setas | W A S D |
| Pesado / chute no Football | X | F |
| Especial | Z | G |
| Pausar / continuar | Esc | Esc |

É possível remapear as teclas em **Configurações** (⚙), sem duplicar comandos. O teclado físico pode limitar a quantidade de teclas simultâneas; escolha outra combinação caso alguma deixe de responder. Clique fora de um campo de texto antes de controlar o jogador; Esc fecha uma janela e devolve o foco à arena.

## Modos e aparência

| Modo | Mecânica desta implementação |
|---|---|
| Classic | Movimento, contato com plataformas, pesado e eliminação ao sair da arena. Último sobrevivente vence. |
| Arrows | Segure Especial, gire a mira continuamente com as quatro direções e solte para disparar; mirar bloqueia movimento. Flechas empurram. |
| Death Arrows | O disparo funciona como em Arrows; acertar uma flecha elimina. |
| Grapple | Segure Especial para prender o gancho a uma superfície próxima; solte para liberar. Contato de um oponente pode soltá-lo. |
| VTOL | Propulsores direcionais, rotação, colisões e pesado. |
| Football | Dois times, bola e gols; Pesado funciona como chute. O placar de cada integrante mostra os pontos do time. |

O botão **Original / Adapted** e a opção Layout em Configurações mudam a disposição da interface durante a mesma partida. A simulação usa passos fixos de 1/60 s e coordenadas independentes da tela. **Original é uma reconstrução da referência**, sem comprovação pixel a pixel.

Arco, corda, flecha e rodinha de recarga são desenhados no **Canvas**. A mira gira em 360° e pode ser ajustada durante a recarga; a rodinha se completa quando outro disparo fica disponível. Use Z + setas no Jogador 1 e G + WASD no Jogador 2, ou as teclas configuradas. Cima/W gira em um sentido; baixo/S, no outro. Com um único humano local ou no online, WASD também funciona para o Jogador 1 quando suas direções estão no padrão; Especial continua Z. Todos os participantes online precisam deste pacote atualizado; versões anteriores não entendem as novas regras. Esta atualização conserva as regras Firebase já publicadas.

A interface usa a paleta escura da tela inicial em salas, configurações, seletor de mapas, regras, HUD e editor.

Em **Aparência**, há 30 bolinhas geradas por IA: dez refeitas e vinte novas, além dos seis arcos refeitos. São PNGs cinza transparentes, com sombras suaves e coloração por filtro de imagem. Não há desenho procedural das skins nem Canvas nas prévias. O jogo só exibe as texturas prontas. A cor da bolinha e a do arco são independentes. Os IDs antigos e as escolhas salvas foram preservados; online usa protocolo 9. Veja [SKINS.md](SKINS.md).

Cor configurável por humano. Áudio sintetizado localmente, com volume/mudo. Para um computador mais lento, use **Gráficos → Baixo**; isso reduz a resolução do Canvas sem modificar o passo da física. A configuração de referência é Samsung Chromebook 3, 2 GB, 1366×768; não houve medição nesse aparelho.

## Mapas e editor

O catálogo possui **33 entradas**: 20 arenas autorais e 13 entradas/variantes de sete mapas reais, com nome, autor e publicação oficial anteriores a 2026. O payload dos mapas foi obtido em outubro de 2026; ele não comprova geometria idêntica à de 2025. Consulte a lista e as adaptações em `MAPAS.md`.

O seletor de mapas local e online inclui busca, filtro por modo e uma prévia grande antes de confirmar. A prévia mostra a gravidade própria do mapa: o ajuste 1× a multiplica, preservando a física anterior aos controles personalizados. O local mantém ajustes salvos; use **Restaurar padrão** para voltar a 1×.

Em **Map Editor**, crie ou carregue um mapa, selecione uma ferramenta e desenhe na arena. Há retângulos, círculos, polígonos, blocos de impulso, spawns, gols, zonas e juntas; seleção, movimento, tamanho, rotação, propriedades físicas e Undo/Redo. O painel também permite selecionar objetos ocultos por outros objetos.

- **Bloco de impulso ↑** cria uma plataforma verde que lança para cima ao tocar sua parte superior. Pode ser girada; o impulso acompanha a orientação. A propriedade **Impulso para cima (0 desliga)** aceita de 0 a 38, em unidades da engine; padrão 18. Exportação e partidas online preservam o bloco.
- **Test map** joga o rascunho; **Back to editor** retorna para continuar editando.
- **Save** grava no armazenamento deste navegador. **Load a map** recupera mapas incluídos ou salvos.
- **Export** cria um JSON portátil; **Import** valida e abre esse formato, preservando o rascunho se o arquivo for inválido. Não importa códigos do formato original do Bonk.io.
- Faça uma exportação para guardar seus mapas. O armazenamento de páginas `file://` varia entre navegadores e pode ser apagado; importação/exportação é a alternativa independente dele.

## Verificação para desenvolvimento

Quem joga não precisa de Node. Para continuar o projeto, com Node instalado, execute dentro desta pasta:

```sh
node check-core.cjs
node check-rules.cjs
node check-prediction.cjs
node check-baller.cjs
node check-cosmetics.cjs
```

As checagens existentes verificam física, regras, cosméticos, previsão e mapas. Para o servidor atual, execute `node check-server.cjs` e `node check-server-client.cjs`; com Chrome e Playwright, execute `node check-server-browser.cjs`. Os arquivos `check-online.cjs`, `check-room.cjs`, `check-pin.cjs` e `check-hybrid.cjs` pertencem ao transporte legado Firebase/WebRTC, que não é carregado pela interface atual.

## Conexão pela internet

A versão atual entrega o jogo e o multiplayer pelo servidor Node. Ele executa a física a 60 Hz e envia até 20 estados por segundo por WebSocket. Abrir o HTML diretamente continua funcionando no modo local; online exige a URL do servidor publicada. A aba do criador não precisa ficar visível para manter a partida dos demais.

Reconexão automática reserva a vaga por 60 segundos. Sair transfere a administração ao próximo participante. Salas vazias, convites vencidos e sessões encerradas são removidos. O servidor não expira as partidas aos 45 minutos e não guarda histórico crescente de comandos. Um reinício do processo perde as partidas em memória e exige criar uma nova sala.

O projeto Firebase já configurado (bonk-98544) está no plano Spark gratuito. O Realtime Database não executa a física; a publicação em Cloud Run exige faturamento e pode gerar cobrança. A hospedagem ainda não foi ativada. Detalhes, limites, instruções e resultados em [SERVIDOR.md](SERVIDOR.md) e [VERIFICACAO.md](VERIFICACAO.md).

Biblioteca de física, WebSocket e fontes têm suas licenças incluídas; consulte [LICENCAS.md](LICENCAS.md).



