const WebSocket = require('ws');

// Временное хранилище активных соединений для каждой игры
const activeGames = new Map();
const games = new Map();

function setupGameWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws/game' });

  console.log('Game WebSocket server started at /ws/game');

  wss.on('connection', (ws, req) => {
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);

        if (data.type === 'join') {
          const { gameId, userId } = data;

          if (!gameId || !userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Missing gameId or userId' }));
            return;
          }

          // Проверяем, существует ли игра
          if (!activeGames.has(gameId)) {
            ws.send(JSON.stringify({ type: 'error', message: `Game ${gameId} not found or not started yet` }));
            return;
          }

          // Добавляем соединение в список активных для игры
          activeGames.get(gameId).add(ws);
          ws.gameId = gameId;
          ws.userId = userId;

          console.log(`User ${userId} joined WebSocket game ${gameId}`);
          ws.send(JSON.stringify({ type: 'joined', message: `Connected to game ${gameId}` }));

          // Рассылаем всем игрокам, что кто-то подключился
          broadcastToGame(gameId, {
            type: 'player_joined',
            userId,
            timestamp: Date.now(),
          });
        }

        if (data.type === 'event') {
          const { gameId } = ws;
          if (gameId) {
            broadcastToGame(gameId, {
              type: 'event',
              event: data.event,
              userId: ws.userId,
              timestamp: Date.now(),
            });
          }
        }

      } catch (err) {
        console.error('WebSocket error:', err);
      }
    });

    ws.on('close', () => {
      const { gameId, userId } = ws;
      if (gameId && activeGames.has(gameId)) {
        activeGames.get(gameId).delete(ws);
        console.log(`User ${userId} disconnected from game ${gameId}`);

        broadcastToGame(gameId, {
          type: 'player_left',
          userId,
          timestamp: Date.now(),
        });

        if (activeGames.get(gameId).size === 0) {
          activeGames.delete(gameId);
          console.log(`Game ${gameId} WebSocket connections cleared`);
        }
      }
    });
  });
}

// Создание игры (вызывается из /lobbies/:id/status при смене в in-progress)
function createGameFromLobby(gameData) {
  const { id: gameId } = gameData;
  games.set(gameId, gameData);

  // Инициализация пустого набора активных подключений для этой игры
  activeGames.set(gameId, new Set());

  console.log(`Game ${gameId} initialized in WebSocket`);
}

function broadcastToGame(gameId, message) {
  if (!activeGames.has(gameId)) return;

  const clients = activeGames.get(gameId);
  const payload = JSON.stringify(message);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

module.exports = { setupGameWebSocket, createGameFromLobby, broadcastToGame };
