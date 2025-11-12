const WebSocket = require('ws');
const { setupPingPong } = require('./pingpong');
const { addConnection, removeConnection } = require('./wsConnections');
const { verifyJwtAndGetUserId } = require('./auth'); // пример функции проверки JWT

function startWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: '/ws/game' });

  wss.on('connection', (ws, req) => {
    // Получаем userId из JWT (например из хедера Sec-WebSocket-Protocol)
    const token = req.headers['sec-websocket-protocol'];
      console.log('WS connection attempt, token:', token);
    const userId = verifyJwtAndGetUserId(token);
    if (!userId) {
          console.log('Unauthorized WS connection, closing');
      ws.close(1008, 'Unauthorized'); // закрываем соединение если нет userId
      return;
    }
    console.log(`WS connected for userId ${userId}`);
    addConnection(userId, ws);
    console.log(`WS подключен для пользователя ${userId}`);

    setupPingPong(ws);

    ws.on('close', () => {
      removeConnection(userId);
      console.log(`WS отключён для пользователя ${userId}`);
    });
  });
}

module.exports = { startWebSocketServer };
