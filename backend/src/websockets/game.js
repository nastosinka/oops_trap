const WebSocket = require('ws');

const gameSessions = new Map();

const connectedPlayers = new Map();

// Инициализация игрового веб-сокета
function setupGameWebSocket(server) {
    const wss = new WebSocket.Server({ server, path: '/ws/game/' });

    console.log('Game WebSocket server started at /ws/game/');

    wss.on('connection', (ws, req) => {
        // Клиент сообщает свой playerId при подключении
        ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg);
                if (data.type === 'init' && data.playerId) {
                    ws.playerId = data.playerId;
                    connectedPlayers.set(data.playerId, ws);
                    console.log(`Player ${data.playerId} connected to WS`);

                    // Авто-назначение в сессию, если игра уже существует
                    for (const session of gameSessions.values()) {
                        if (session.game.players.some(p => p.id === data.playerId)) {
                            session.players.push(ws);
                            console.log(`Player ${data.playerId} auto-added to game ${session.gameId}`);
                        }
                    }
                }
            } catch (err) {
                console.error('WS message parse error:', err);
            }
        });

        ws.on('close', () => {
            if (ws.playerId) connectedPlayers.delete(ws.playerId);
            for (const session of gameSessions.values()) {
                session.players = session.players.filter(p => p !== ws);
            }
        });
    });
}

//Создание игровой сессии (вызывается при старте игры)
function createGameSession(game) {
    const session = {
        gameId: game.id,
        game,
        players: [],
        waitTimer: null,
        gameTimer: null
    };

    // Добавляем всех подключённых игроков, которые в этом лобби
    for (const player of game.players) {
        const ws = connectedPlayers.get(player.id);
        if (ws) {
          session.players.push(ws);
          console.log(`Player ${player.id} joined game ${session.gameId}`);
          console.log(`Current players in game ${session.gameId}:`, session.players.map(p => p.playerId).join(', '));
        }
    }

    gameSessions.set(game.id, session);
    console.log(`Game session ${game.id} created for lobby ${game.lobbyId} for game ${game.id}`);

    // Таймер ожидания игроков
    session.waitTimer = setTimeout(() => {
        console.log(`Waiting timer for game ${game.id} finished. Game starts now!`);

        broadcast(session.gameId, {
            type: 'game-start',
            message: 'The game is starting now!'
        });

        // Основной игровой таймер
        session.gameTimer = setTimeout(() => {
            console.log(`Game ${game.id} ended!`);
            session.game.status = 'finished';
            broadcast(session.gameId, { type: 'game-end', message: 'Game finished' });

            // Очищаем сессию
            clearTimeout(session.waitTimer);
            clearTimeout(session.gameTimer);
            gameSessions.delete(game.id);
        }, 20000); // тест 20с игра
    }, 10000); // тест 10с ожидание
}

//Отправка сообщения всем игрокам в сессии
function broadcast(gameId, message) {
    const session = gameSessions.get(gameId);
    if (!session) return;
    const payload = JSON.stringify(message);
    for (const ws of session.players) {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    }
}

module.exports = { setupGameWebSocket, createGameSession, broadcast, gameSessions };
