# Hospedagem gratuita publicada — 13/10/2026

Jogo: [https://baller-balls.onrender.com](https://baller-balls.onrender.com). Serviço Render Free, US$ 0/mês, Virginia, uma instância de 0,1 CPU/512 MB e limite de quatro salas. Repositório Omiorgavrapo/Bonky1.3, branch codex/server-raster-skins. Auto-deploy desativado para não reiniciar partidas ao editar código; novas versões são publicadas manualmente.

O serviço adormece após 15 minutos sem tráfego de usuários e leva cerca de um minuto para acordar. O cliente aguarda até 90 segundos na conexão inicial. Não foi criado ping externo para mantê-lo acordado. As cotas gratuitas são compartilhadas com os outros serviços da conta. Reinícios descartam partidas em memória.

Testado pela internet com cinco jogadores, skins novas, saída e retomada do dono, estados ordenados e limpeza da sala de teste. Nesta rede, cinco pings mediram 154, 169, 159, 172 e 166 ms; isso não promete a mesma latência em outras redes.

Documentação: https://render.com/docs/free e https://render.com/docs/websocket

As instruções Google abaixo são uma alternativa opcional que não foi ativada.

# Multiplayer no servidor — versão 3.1 / protocolo 9

A física, bots, colisões, rodadas e placar agora rodam no processo Node do
servidor, a 60 passos por segundo. O criador da sala é um cliente, com as
mesmas regras e previsão de comandos dos convidados. A aba dele não controla
o relógio nem envia estados para outros jogadores. Fechar ou suspender essa
aba não trava a partida dos demais. Sair transfere a administração da sala.

Os clientes recebem até 20 estados por segundo por WebSocket, sem escrever
movimento no Firebase. Geometria vai na configuração/início, não em cada
estado. A previsão local aceita no máximo 30 passos pendentes; posições dos
demais são interpoladas. Teclas são enviadas imediatamente, incluindo a
soltura ao perder o foco, e repetidas a cada 100 ms. O servidor libera
comandos sem atualização por 750 ms.

## Executar e conferir aqui

Com Node 22 ou superior instalado, nesta pasta:

```powershell
npm ci --ignore-scripts
npm start
```

Abra `http://localhost:8080` em dois navegadores. Crie a sala em um deles,
gere o PIN e entre pelo outro. Minimize a aba do dono: o servidor continua.
Feche a conexão e abra novamente em até 60 segundos: o mesmo jogador pode
retomar sua vaga. Atualizar a página na mesma aba retoma a sessão usando
`sessionStorage`. **Sair** libera a vaga e apaga essa sessão.

Para verificar automaticamente:

```powershell
npm test
```

`check-server.cjs` verifica três horas simuladas, seis modos, limitação de
comandos, recuperação de vaga, transferência de dono, filas de socket e
50 ciclos de criação/limpeza. `check-server-client.cjs` conecta dois clientes
reais por WebSocket e verifica que o tempo avança sem chamar o loop do dono.
`check-server-browser.cjs` verifica a interface em Chrome com cinco jogadores.

## Publicar no Google que já está configurado

Projeto: `bonk-98544`. O Realtime Database existente é armazenamento/transporte;
ele não executa o processo de física. Em 13/10/2026, o console mostrou **Spark,
sem custos**. Para executar esse servidor no Google Cloud Run é necessário
o proprietário habilitar faturamento (Blaze). Isso pode gerar cobrança e
não foi ativado automaticamente.

Após essa habilitação e com o Google Cloud CLI autenticado no projeto,
execute `deploy-google.ps1` desta pasta. O script usa o Dockerfile, publica
em São Paulo (`southamerica-east1`), limita a **uma instância** e retorna
a URL HTTPS do jogo. O próprio servidor entrega a interface. Abra essa URL
para criar ou entrar em salas. Não precisa copiar arquivos entre jogadores.

O limite de uma instância é obrigatório nesta versão porque salas ficam em
memória. Afinidade de sessão sozinha não garante que jogadores diferentes
caiam no mesmo processo. Não aumente esse limite sem implementar roteamento
compartilhado. Não publique duas revisões com divisão de tráfego.

Cloud Run encerra conexões WebSocket ao atingir o timeout configurado (aqui,
60 minutos); o cliente tenta retomar a sessão, sem recriar a sala nem duplicar
o jogador, desde que o mesmo processo continue vivo. Um reinício do processo
ou uma nova publicação perde a partida em memória e pede uma nova sala.
Esta versão não promete persistência de partidas após reinício do serviço.
Com todos desconectados, as vagas são removidas em 60 segundos e a sala é
descartada. Não há mais expiração artificial da partida aos 45 minutos.

Ao abrir o HTML pelo arquivo ou continuar servindo a interface em um host
estático, preencha `serverURL` em `online-config.js` com a URL HTTPS publicada.
Para origem estática diferente, configure `ALLOWED_ORIGINS` no servidor com
essa origem exata; páginas hospedadas pelo próprio servidor já são aceitas.
Sem uma URL de servidor, abrir o arquivo continua oferecendo jogo local,
mas não cria uma partida online dependente da aba do jogador.

## Limites e estabilidade

- Até 5 participantes por sala e 24 salas por processo; até 160 conexões.
- PINs de uso único por 5 minutos, invalidados ao reconfigurar ou trocar dono.
- Sessões usam uma capacidade aleatória de 192 bits, guardada por aba.
- Fila de saída limitada a 128 KiB; estados atrasados são descartados. Uma
  conexão persistentemente lenta é refeita em vez de acumular atraso.
- Até 6 passos de recuperação por iteração; uma pausa longa não desencadeia
  uma fila infinita de física.
- O servidor não guarda o histórico de comandos da rodada. Snapshots de
  replay continuam disponíveis no modo local, mas são desativados no servidor.
- Posições, resultados e identidade do jogador vêm do servidor; clientes
  enviam apenas comandos e solicitações de configuração autorizadas.

Testes locais não medem latência de redes diferentes nem garantem ausência
de lag no aparelho do jogador. A região, distância e conexão continuam
afetando o tempo de resposta. Medições e publicação real ainda precisam
ser verificadas depois de liberar a hospedagem.

Documentação oficial:
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://docs.cloud.google.com/run/docs/triggering/websockets
