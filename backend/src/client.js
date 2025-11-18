const WebSocket = require('ws');

const gameId = 1;  
const userId = 2;  

const WS_URL = `ws://localhost/ws/game/${gameId}`;

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log(`Player ${userId} connected to WS for game ${gameId}`);

    ws.send(JSON.stringify({
        type: 'init',
        playerId: userId
    }));
});

ws.on('message', (msg) => {
    try {
        const data = JSON.parse(msg);
        console.log(`Player ${userId} received:`, data);
    } catch (err) {
        console.error('Message parse error:', err);
    }
});

ws.on('close', () => {
    console.log(`Player ${userId} disconnected`);
});

ws.on('error', (err) => {
    console.error(`WS error for player ${userId}:`, err.message);
});