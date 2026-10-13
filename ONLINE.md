# Jogar pela internet — servidor dedicado

Esta versão usa o servidor Node para física e placar. Todos os participantes,
incluindo quem criou a sala, se conectam a ele por WebSocket. O Firebase
Realtime Database do pacote anterior não executava a partida: a aba do dono
era responsável pela simulação.

1. Com o servidor publicado, abra a URL HTTPS do jogo.
2. Escolha **Criar sala**, configure mapa, participantes, regras e vitórias.
3. Clique **Gerar PIN**. Um convite conecta uma pessoa e vale cinco minutos.
4. O amigo abre a mesma URL, escolhe **Entrar sala** e digita os oito números.
5. Quando todos entrarem, clique **Iniciar partida**.

O servidor mantém a partida enquanto os participantes jogam. Se o dono sair,
outro participante recebe os controles da sala. Entradas durante a partida
assistem e entram na próxima. Uma queda curta permite recuperar a vaga e a
mesma identidade por até 60 segundos. Reiniciar o processo do servidor perde
as partidas em memória.

**A hospedagem de produção ainda não foi ativada.** O projeto Google atual
está no plano Spark gratuito. Hospedar o processo em Cloud Run exige o dono
habilitar faturamento e pode gerar cobrança. Executar e testar o servidor,
publicar no Google e configurar clientes está explicado em [SERVIDOR.md](SERVIDOR.md).

Abrir `index.html` pelo arquivo continua funcionando para jogar localmente.
Nesse caso, online requer `serverURL` em `online-config.js`. O jogo não volta
automaticamente a executar a partida na aba do criador.
