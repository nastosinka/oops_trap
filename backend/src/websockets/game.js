const WebSocket = require('ws');

const gameSessions = new Map(); // все игровые сессии
const connectedPlayers = new Map(); // подключенные игроки
const playerGameMap = new Map(); // Для отслеживания в какой игре находится игрок

function setupGameWebSocket(server) { // вычленение айдишника
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const match = url.pathname.match(/^\/ws\/game\/(\d+)$/);

            if (!match) {
                console.log('Invalid WebSocket path:', req.url);
                socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                socket.destroy();
                return;
            }

            const gameId = Number(match[1]);
            
            wss.handleUpgrade(req, socket, head, (ws) => {
                ws.gameId = gameId;
                wss.emit('connection', ws, req);
            });
        } catch (error) {
            console.error('WebSocket upgrade error:', error);
            socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
            socket.destroy();
        }
    });

    console.log('Game WebSocket server started at /ws/game/');

    wss.on('connection', (ws, req) => {
        console.log(`New WebSocket connection for game ${ws.gameId}`);

        // Отправляем подтверждение подключения сразу
        ws.send(JSON.stringify({
            type: 'connection-established',
            gameId: ws.gameId,
            message: 'Successfully connected to game server'
        }));

        ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg);
                console.log(`Received message from game ${ws.gameId}:`, data);
                handleGameMessage(ws, data);
                
            } catch (err) {
                console.error('WS message parse error:', err);
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Invalid message format' 
                }));
            }
        });

        ws.on('close', (code, reason) => {
            console.log(`WebSocket closed for game ${ws.gameId}:`, code, reason);
            handlePlayerDisconnect(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            handlePlayerDisconnect(ws);
        });
    });

    return wss;
}

function handleGameMessage(ws, data) {
    switch (data.type) {
        case 'init':
            if (data.playerId) {
                handlePlayerInit(ws, data.playerId);
            }
            break;

        case 'JOIN_GAME':
            handleGameJoin(ws, data);
            break;

        case 'PLAYER_LEFT':
            handlePlayerLeft(ws, data);
            break;

        case 'ping':
            // Ответ на ping
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

        default:
            console.warn(`Unknown message type: ${data.type}`);
            ws.send(JSON.stringify({
                type: 'error',
                message: `Unknown message type: ${data.type}`
            }));
    }
}

function handleGameJoin(ws, data) {
    console.log(`Player ${data.userId} joining game ${data.gameId}`);
    if (data.userId) {
        handlePlayerInit(ws, data.userId);
    }
}

function handlePlayerInit(ws, playerId) { 
    ws.playerId = playerId;
    connectedPlayers.set(playerId, ws);
    playerGameMap.set(playerId, ws.gameId);
    
    console.log(`Player ${playerId} initialized for game ${ws.gameId}`);

    // Автоматическое добавление в существующую сессию
    const session = gameSessions.get(ws.gameId);
    if (session) {
        const isPlayerInGame = session.game.players.some(p => p.id === playerId);
        if (isPlayerInGame) {
            // Удаляем старое соединение если есть
            session.players = session.players.filter(p => p.playerId !== playerId);
            // Добавляем новое соединение
            session.players.push(ws);
            
            console.log(`Player ${playerId} added to game ${session.gameId}`);
            console.log(`Current players in game ${session.gameId}:`, 
                session.players.map(p => p.playerId).join(', '));
            
            // Отправляем подтверждение игроку
            ws.send(JSON.stringify({
                type: 'game-joined',
                gameId: session.gameId,
                players: session.game.players.map(p => ({ id: p.id, name: p.name })),
                gameState: getGameState(session)
            }));

            // Уведомляем других игроков
            broadcast(ws.gameId, {
                type: 'player-connected',
                playerId: playerId,
                players: session.players.map(p => p.playerId)
            }, ws); // исключаем текущего игрока

        } else {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Player not found in this game'
            }));
        }
    } else {
        ws.send(JSON.stringify({
            type: 'waiting-for-game',
            message: 'Game session not started yet'
        }));
    }
}

function handlePlayerLeft(ws, data) {
    console.log(`Player ${data.userId} left game ${data.gameId}, reason: ${data.reason}`);
    
    const session = gameSessions.get(ws.gameId);
    if (session) {
        // Удаляем игрока из сессии
        session.players = session.players.filter(p => p.playerId !== data.userId);
        
        // Уведомляем других игроков
        broadcast(ws.gameId, {
            type: 'player-disconnected',
            playerId: data.userId,
            reason: data.reason,
            remainingPlayers: session.players.map(p => p.playerId)
        });

        // Если игроков не осталось, очищаем сессию
        if (session.players.length === 0) {
            console.log(`No players left in game ${ws.gameId}, cleaning up session`);
            cleanupGameSession(ws.gameId);
        }
    }
}

// Обработчик отключения игрока
function handlePlayerDisconnect(ws) {
    const playerId = ws.playerId;
    const gameId = ws.gameId;
    
    if (playerId) {
        connectedPlayers.delete(playerId);
        playerGameMap.delete(playerId);
        console.log(`Player ${playerId} disconnected from WS`);
    }
    
    const session = gameSessions.get(gameId);
    if (session) {
        const playerCountBefore = session.players.length;
        session.players = session.players.filter(p => p !== ws);
        const playerCountAfter = session.players.length;
        
        console.log(`Player removed from game ${gameId}. Players: ${playerCountAfter}/${playerCountBefore}`);
        
        // Если игрок был авторизован, уведомляем остальных об отключении
        if (playerId && playerCountAfter > 0) {
            broadcast(gameId, {
                type: 'player-disconnected',
                playerId: playerId,
                reason: 'connection_lost',
                remainingPlayers: session.players.map(p => p.playerId)
            });
        }
        
        // Если все игроки отключились, очищаем сессию
        if (playerCountAfter === 0) {
            cleanupGameSession(gameId);
        }
    }
}

// Очистка игровой сессии
function cleanupGameSession(gameId) {
    const session = gameSessions.get(gameId);
    if (session) {
        console.log(`Cleaning up game session ${gameId}`);
        
        if (session.waitTimer) clearTimeout(session.waitTimer);
        if (session.gameTimer) clearInterval(session.gameTimer);
        
        gameSessions.delete(gameId);
        
        // Резолвим промис если игра не завершилась нормально
        if (session.resolve && !session.gameFinished) {
            const stats = activeGame(session.game);
            session.resolve(stats);
        }
    }
}

// Создание игровой сессии
function createGameSession(game) {
    return new Promise((resolve) => {
        const session = {
            gameId: game.id,
            game: game,
            players: [],
            waitTimer: null,
            gameTimer: null,
            gameState: initializeGameState(game),
            timeLeft: 120, // 2 минуты по умолчанию
            stats: [],
            resolve: resolve,
            gameFinished: false
        };

        // Добавляем всех подключённых игроков
        let connectedCount = 0;
        for (const player of game.players) {
            const ws = connectedPlayers.get(player.id);
            if (ws && ws.gameId === game.id) {
                session.players.push(ws);
                connectedCount++;
                console.log(`Player ${player.id} joined game ${session.gameId}`);
            }
        }

        console.log(`Game session ${game.id} created with ${connectedCount}/${game.players.length} players connected`);

        gameSessions.set(game.id, session);

        // Если нет подключенных игроков, сразу завершаем
        if (connectedCount === 0) {
            console.log(`No players connected for game ${game.id}, ending session`);
            const stats = activeGame(game);
            session.gameFinished = true;
            resolve(stats);
            return;
        }

        // Уведомляем игроков о начале ожидания
        broadcast(game.id, {
            type: 'waiting-start',
            message: 'Waiting for players...',
            waitTime: 10000, // 10 секунд
            connectedPlayers: session.players.map(p => p.playerId),
            totalPlayers: game.players.length,
            gameSettings: {
                map: game.map,
                time: game.time,
                trapper: game.trapper
            }
        });

        // Таймер ожидания игроков
        session.waitTimer = setTimeout(() => {
            console.log(`Waiting timer for game ${game.id} finished. Game starts now!`);
            
            // Проверяем, остались ли игроки
            if (session.players.length === 0) {
                console.log(`No players left in game ${game.id}, ending`);
                const stats = activeGame(game);
                session.gameFinished = true;
                resolve(stats);
                return;
            }

            // Запускаем игру
            startGame(session);
            
        }, 10000); // 10 секунд ожидания
    });
}

function initializeGameState(game) {
    return {
        players: game.players.map((player, index) => ({
            id: player.id,
            name: player.name,
            x: 100 + index * 50,
            y: 100 + index * 50,
            color: getPlayerColor(index),
            score: 0,
            alive: true
        })),
        map: game.map || 1,
        startTime: Date.now(),
        objects: [] // игровые объекты
    };
}

function getPlayerColor(index) {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#6A0572', '#118AB2'];
    return colors[index % colors.length];
}

function startGame(session) {
    console.log(`Starting game ${session.gameId}`);
    
    // Уведомляем о начале игры
    broadcast(session.gameId, {
        type: 'GAME_START',
        payload: {
            timeLeft: session.timeLeft,
            gameState: session.gameState
        }
    });

    // Запускаем игровой таймер
    session.gameTimer = setInterval(() => {
        session.timeLeft--;
        
        // Отправляем обновление времени
        broadcast(session.gameId, {
            type: 'TICK',
            payload: {
                timeLeft: session.timeLeft
            }
        });

        // Отправляем обновленное состояние
        broadcast(session.gameId, {
            type: 'GAME_STATE_UPDATE',
            payload: session.gameState
        });

        // Проверяем окончание игры
        if (session.timeLeft <= 0) {
            endGame(session);
        }
    }, 1000); // обновление каждую секунду
}

function endGame(session) {
    console.log(`Game ${session.gameId} ended!`);
    
    clearInterval(session.gameTimer);
    session.gameFinished = true;
    
    const stats = activeGame(session.game);
    session.stats = stats;
    
    broadcast(session.gameId, { 
        type: 'GAME_END', 
        payload: {
            stats: stats,
            winners: stats.filter(s => s.result === 1).map(s => s.userId)
        }
    });
    
    // Очищаем сессию и резолвим промис
    setTimeout(() => {
        cleanupGameSession(session.gameId);
        session.resolve(stats);
    }, 5000); // даем время на отображение результатов
}

// Отправка сообщения всем игрокам в сессии
function broadcast(gameId, message, excludeWs = null) {
    const session = gameSessions.get(gameId);
    if (!session) {
        console.log(`Attempted to broadcast to non-existent game ${gameId}`);
        return;
    }
    
    const payload = JSON.stringify(message);
    let sentCount = 0;
    
    for (const ws of session.players) {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(payload);
                sentCount++;
            } catch (error) {
                console.error(`Error sending to player ${ws.playerId}:`, error);
            }
        }
    }
    
    console.log(`Broadcast to game ${gameId} (${message.type}): ${sentCount}/${session.players.length} players received`);
}

// Отправка сообщения конкретному игроку
function sendToPlayer(playerId, message) {
    const ws = connectedPlayers.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error(`Error sending to player ${playerId}:`, error);
        }
    }
    return false;
}

function activeGame(game) {
    const stats = game.players.map((player) => ({
        userId: player.id,
        userName: player.name,
        role: 'civilian', // или 'trapper' в зависимости от логики игры
        score: Math.floor(Math.random() * 100), // пример счета
        result: Math.random() > 0.3 ? 1 : 0, // пример результата (1 - победа, 0 - поражение)
        map: game.map,
        timePlayed: 120 // секунды
    }));
    return stats;
}

// Получение информации о сессии
function getGameSession(gameId) {
    return gameSessions.get(gameId);
}

// Получение списка активных игр
function getActiveGames() {
    return Array.from(gameSessions.keys());
}

module.exports = { 
    setupGameWebSocket, 
    createGameSession, 
    broadcast, 
    sendToPlayer,
    getGameSession,
    getActiveGames,
    gameSessions
};
