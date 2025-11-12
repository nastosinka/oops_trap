const WebSocket = require('ws');
const { setupPingPong } = require('./pingpong');

function startWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: '/ws/game' });

  wss.on('connection', (ws) => {
    console.log('Новый клиент WS подключен');
    setupPingPong(ws);
  });
}

module.exports = { startWebSocketServer };