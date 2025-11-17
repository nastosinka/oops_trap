const WebSocket = require('ws');

// Конфигурация
const WS_URL = 'ws://localhost/ws/game/';
const NUM_GAMES = 3;
const PLAYERS_PER_GAME = 2;

// Генерируем игроков
const players = [];
for (let g = 1; g <= NUM_GAMES; g++) {
    for (let p = 1; p <= PLAYERS_PER_GAME; p++) {
        players.push({
            playerId: (g - 1) * PLAYERS_PER_GAME + p,
            gameId: g
        });
    }
}

// Создаём подключения
const sockets = [];

for (const player of players) {
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
        console.log(`Player ${player.playerId} connected to WS`);
        // Отправляем серверу свой playerId
        ws.send(JSON.stringify({
            type: 'init',
            playerId: player.playerId
        }));
    });

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            console.log(`Player ${player.playerId} received:`, data);
        } catch (err) {
            console.error('Message parse error:', err);
        }
    });

    ws.on('close', () => {
        console.log(`Player ${player.playerId} disconnected`);
    });

    ws.on('error', (err) => {
        console.error(`WS error for player ${player.playerId}:`, err.message);
    });

    sockets.push(ws);
}

// Дополнительно: закрыть все соединения через 30 секунд
setTimeout(() => {
    for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) ws.close();
    }
    console.log('All test clients disconnected');
}, 30000);
