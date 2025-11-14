const WebSocket = require('ws');
const axios = require('axios');
const { getConnection } = require('./wsConnections');

//добавление конкреного клиента - lcient.js
// start...Socket - там список пользователей из лобби (их бы add), но он не вызы
//вается нигде
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
        console.log(data)
        //addConnection(data.userId, '/ws/game');
        if (data.type === 'join') {
          const { gameId, userId } = data;
          console.log(`User ${userId} wants to join game ${gameId}`);
          if (!gameId || !userId) {
            console.log(`Game ${gameId} not found for user ${userId}`);
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


function createGameFromLobby(gameData) {
  const { id: gameId, players } = gameData;

  if (games.has(gameId)) {
    games.delete(gameId);
    activeGames.delete(gameId);
  }
  games.set(gameId, gameData);

  // Инициализация пустого набора активных подключений для этой игры
  activeGames.set(gameId, new Set());

  console.log(`Game ${gameId} initialized in WebSocket`);
  // ======== пункт 3: уведомляем игроков ========
  players.forEach(player => {
    console.log(player.id);
    const ws = getConnection(player.id);
    console.log(ws);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'GAME_READY',
        payload: { gameId }
      }));
    }
  });
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

function startGame(gameId) {
  const game = games.get(gameId);
  if (!game) return;

  game.status = 'in_progress';
  game.timeLeft = game.settings?.timeLimit || 60;
  game.players = game.players || []; // массив { id, score, position }

  console.log(`Game ${gameId} started`);

  broadcastToGame(gameId, {
    type: 'GAME_START',
    payload: { map: game.map, timeLeft: game.timeLeft },
  });

  // Запуск таймера
  game.interval = setInterval(() => {
    game.timeLeft -= 1;

    broadcastToGame(gameId, {
      type: 'TICK',
      payload: { timeLeft: game.timeLeft },
    });

    if (game.timeLeft <= 0) {
      clearInterval(game.interval);
      endGame(gameId);
    }
  }, 1000);
}

async function endGame(gameId) {
  const game = games.get(gameId);
  if (!game) return;

  console.log(`Game ${gameId} ended`);

  // Генерируем статистику
  const stats = (game.players || []).map((p) => ({
    userId: p.id,
    score: p.score || 0,
  }));

  broadcastToGame(gameId, { type: 'GAME_END', payload: { stats } });

    // Вызов эндпоинта, чтобы пометить лобби как завершённое
  try {
    await axios.post(`http://localhost:8080/api/lobby/lobbies/${gameId}/status`, { 
      ownerId: game.ownerId || 1,
      newStatus: 'finished',
    });
    console.log(`Lobby ${gameId} marked as finished`);
  } catch (err) {
    console.error(`Error marking lobby ${gameId} as finished:`, err.message);
  }

  // Очистка
  setTimeout(() => {
    clearInterval(game.interval);
    activeGames.delete(gameId);
    games.delete(gameId);
    console.log(`Game ${gameId} removed`);
  }, 5000);
}

module.exports = {
  setupGameWebSocket,
  createGameFromLobby,
  broadcastToGame,
  startGame,
  endGame,
};