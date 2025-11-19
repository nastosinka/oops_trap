const WebSocket = require('ws');

const gameSessions = new Map();
const connectedPlayers = new Map();

function setupGameWebSocket(server) {
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

        ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg);
                console.log(`Received message from game ${ws.gameId}:`, data);

                if (data.type === 'init' && data.playerId) {
                    handlePlayerInit(ws, data.playerId);
                }
                
                // Добавьте обработку других типов сообщений здесь
                // Например: ходы игроков, игровые события и т.д.
                
            } catch (err) {
                console.error('WS message parse error:', err);
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Invalid message format' 
                }));
            }
        });

        ws.on('close', () => {
            handlePlayerDisconnect(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            handlePlayerDisconnect(ws);
        });
    });

    return wss;
}

function handlePlayerInit(ws, playerId) {
    ws.playerId = playerId;
    connectedPlayers.set(playerId, ws);
    console.log(`Player ${playerId} connected to WS for game ${ws.gameId}`);

    // Автоматическое добавление в существующую сессию
    const session = gameSessions.get(ws.gameId);
    if (session) {
        // Проверяем, есть ли игрок в этой игре
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
                players: session.game.players.map(p => p.id)
            }));
        }
    }
}

// Обработчик отключения игрока
function handlePlayerDisconnect(ws) {
    if (ws.playerId) {
        connectedPlayers.delete(ws.playerId);
        console.log(`Player ${ws.playerId} disconnected from WS`);
    }
    
    const session = gameSessions.get(ws.gameId);
    if (session) {
        const playerCountBefore = session.players.length;
        session.players = session.players.filter(p => p !== ws);
        const playerCountAfter = session.players.length;
        
        console.log(`Player removed from game ${ws.gameId}. Players: ${playerCountAfter}/${playerCountBefore}`);
        
        // Если все игроки отключились, очищаем сессию
        if (playerCountAfter === 0) {
            cleanupGameSession(ws.gameId);
        } else {
            // Уведомляем остальных игроков об отключении
            broadcast(ws.gameId, {
                type: 'player-disconnected',
                playerId: ws.playerId,
                remainingPlayers: session.players.map(p => p.playerId)
            });
        }
    }
}

// Очистка игровой сессии
function cleanupGameSession(gameId) {
    const session = gameSessions.get(gameId);
    if (session) {
        console.log(`Cleaning up game session ${gameId}`);
        
        if (session.waitTimer) clearTimeout(session.waitTimer);
        if (session.gameTimer) clearTimeout(session.gameTimer);
        
        gameSessions.delete(gameId);
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
            stats: [],
            resolve: resolve // сохраняем resolve для использования позже
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
            resolve(stats);
            return;
        }

        // Уведомляем игроков о начале ожидания
        broadcast(game.id, {
            type: 'waiting-start',
            message: 'Waiting for players...',
            waitTime: 10000, // 10 секунд
            connectedPlayers: session.players.map(p => p.playerId),
            totalPlayers: game.players.length
        });

        // Таймер ожидания игроков
        session.waitTimer = setTimeout(() => {
            console.log(`Waiting timer for game ${game.id} finished. Game starts now!`);
            
            // Проверяем, остались ли игроки
            if (session.players.length === 0) {
                console.log(`No players left in game ${game.id}, ending`);
                const stats = activeGame(game);
                resolve(stats);
                return;
            }

            broadcast(game.id, {
                type: 'game-start',
                message: 'The game is starting now!',
                players: session.players.map(p => p.playerId)
            });

            // Основной игровой таймер
            session.gameTimer = setTimeout(() => {
                console.log(`Game ${game.id} ended!`);
                session.game.status = 'finished';
                
                const stats = activeGame(game);
                broadcast(game.id, { 
                    type: 'game-end', 
                    message: 'Game finished',
                    stats: stats
                });
                
                // Очищаем сессию и резолвим промис
                cleanupGameSession(game.id);
                resolve(stats);
            }, 20000); // тест 20с игра
            
        }, 10000); // тест 10с ожидание
    });
}

// Отправка сообщения всем игрокам в сессии
function broadcast(gameId, message) {
    const session = gameSessions.get(gameId);
    if (!session) {
        console.log(`Attempted to broadcast to non-existent game ${gameId}`);
        return;
    }
    
    const payload = JSON.stringify(message);
    let sentCount = 0;
    
    for (const ws of session.players) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
            sentCount++;
        }
    }
    
    console.log(`Broadcast to game ${gameId}: ${sentCount}/${session.players.length} players received`);
}

// Отправка сообщения конкретному игроку
function sendToPlayer(playerId, message) {
    const ws = connectedPlayers.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
    }
    return false;
}

function activeGame(game) {
    const stats = game.players.map((player) => ({
        userId: player.id,
        role: true,
        time: 12, 
        result: Math.random() > 0.5 ? 1 : 0, // пример результата
        map: game.map
    }));
    return stats;
}



module.exports = { 
    setupGameWebSocket, 
    createGameSession, 
    broadcast, 
    sendToPlayer,
    gameSessions
};