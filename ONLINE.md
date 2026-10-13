# Jogar pela internet — servidor dedicado

Esta versão usa o servidor Node para física e placar. Todos os participantes,
incluindo quem criou a sala, se conectam a ele por WebSocket. O Firebase
Realtime Database do pacote anterior não executava a partida: a aba do dono
era responsável pela simulação.

1. Abra [https://baller-balls.onrender.com](https://baller-balls.onrender.com).
2. Escolha **Criar sala**, configure mapa, participantes, regras e vitórias.
3. Clique **Gerar PIN**. Um convite conecta uma pessoa e vale cinco minutos.
4. O amigo abre a mesma URL, escolhe **Entrar sala** e digita os oito números.
5. Quando todos entrarem, clique **Iniciar partida**.

O servidor mantém a partida enquanto os participantes jogam. Se o dono sair,
outro participante recebe os controles da sala. Entradas durante a partida
assistem e entram na próxima. Uma queda curta permite recuperar a vaga e a
mesma identidade por até 60 segundos. Reiniciar o processo do servidor perde
as partidas em memória.

O servidor foi publicado no Render Free, sem ativar faturamento do Google. Ele pode adormecer sem jogadores e levar cerca de um minuto para voltar. Cotas e reinícios do plano gratuito continuam valendo. Veja [SERVIDOR.md](SERVIDOR.md).

Abrir `index.html` pelo arquivo continua funcionando para jogar localmente.
Nesse caso, online requer `serverURL` em `online-config.js`. O jogo não volta
automaticamente a executar a partida na aba do criador.
