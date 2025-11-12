const WebSocket = require('ws');

const gameId = 1; // ID созданной игры
const userId = 2; // ID пользователя

const ws = new WebSocket(`ws://localhost/ws/game`);

ws.on('open', () => {
  console.log('Connected to Game WebSocket');

  ws.send(JSON.stringify({ type: 'join', gameId, userId }));
});

ws.on('message', (msg) => {
  try {
    const data = JSON.parse(msg);
    console.log('WS Message:', data);
  } catch (err) {
    console.error('WS Message parse error:', err);
  }
});

ws.on('close', () => {
  console.log('WS Disconnected');
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
});
