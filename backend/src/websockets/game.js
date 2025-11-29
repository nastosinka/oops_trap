const WebSocket = require('ws');

const gameRooms = new Map();

function setupGameWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const match = url.pathname.match(/^\/ws\/game\/(\d+)$/);

            if (!match) {
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
            socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
            socket.destroy();
        }
    });

    // Функции должны быть объявлены до их использования
    function broadcastToGame(gameId, message) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom) return;

        gameRoom.players.forEach(player => {
            if (player.connected && player.ws.readyState === player.ws.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }

    function stopGameTimer(gameId) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom || !gameRoom.timer.active) return;

        if (gameRoom.timer.interval) {
            clearInterval(gameRoom.timer.interval);
            gameRoom.timer.interval = null;
        }

        gameRoom.timer.active = false;
        console.log(`⏹️ Таймер остановлен для игры ${gameId}`);

        // Закрываем все соединения в комнате
        gameRoom.players.forEach(player => {
            if (player.connected && player.ws.readyState === player.ws.OPEN) {
                player.ws.close(1000, 'Game finished - time is up');
            }
        });

        // Удаляем комнату
        gameRooms.delete(gameId);
        console.log(`🎯 Игра ${gameId} завершена, комната удалена`);
    }

    function startGameTimer(gameId) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom || gameRoom.timer.active) return;

        gameRoom.timer.active = true;
        gameRoom.timer.timeLeft = gameRoom.timer.totalTime;

        console.log(`⏰ Таймер запущен для игры ${gameId}`);

        // Отправляем начальное состояние таймера
        broadcastToGame(gameId, {
            type: 'timer_started',
            timeLeft: gameRoom.timer.timeLeft,
            totalTime: gameRoom.timer.totalTime
        });

        // Запускаем интервал обновления (каждую секунду)
        gameRoom.timer.interval = setInterval(() => {
            gameRoom.timer.timeLeft--;

            // Отправляем обновление времени всем игрокам
            broadcastToGame(gameId, {
                type: 'timer_update',
                timeLeft: gameRoom.timer.timeLeft,
                totalTime: gameRoom.timer.totalTime,
                active: true
            });

            console.log(`⏱️ Игра ${gameId}: осталось ${gameRoom.timer.timeLeft} секунд`);

            // Если время вышло
            if (gameRoom.timer.timeLeft <= 0) {
                stopGameTimer(gameId);
                console.log(`⏰ Время вышло для игры ${gameId}`);
            }
        }, 1000);
    }

    wss.on('connection', (ws) => {
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log('📨 Сообщение в игре:', message);

                switch (message.type) {
                    case 'init':
                        handleInitGame(ws, message.gameId, message.playerId, message.isHost);
                        break;
                    case 'chat_message':
                        handleChatMessage(ws, message.gameId, message.playerId, message.text);
                        break;
                }
            } catch (error) {
                console.error('❌ Ошибка в игре:', error);
            }
        });

        ws.on('close', () => {
            handlePlayerDisconnect(ws);
        });

        ws.on('error', (error) => {
            console.error('💥 Ошибка соединения с игрой:', error);
        });
    });

    function handleInitGame(ws, gameId, playerId, isHost) {
        let gameRoom = gameRooms.get(gameId);

        if (!gameRoom) {
            gameRoom = {
                players: new Map(),
                hostId: null,
                timer: {
                    active: false,
                    timeLeft: 120,
                    interval: null,
                    totalTime: 120,
                    startTimeout: null
                },
                hasFirstPlayer: false
            };
            gameRooms.set(gameId, gameRoom);
        }

        if (isHost && !gameRoom.hostId) {
            gameRoom.hostId = playerId;
        }

        // Добавляем/обновляем игрока
        gameRoom.players.set(playerId, {
            ws,
            playerId,
            isHost: playerId === gameRoom.hostId,
            ready: false,
            connected: true
        });

        // Сохраняем данные в соединении
        ws.gameId = gameId;
        ws.playerId = playerId;

        // Если это первый игрок, запускаем таймер через 10 секунд
        if (!gameRoom.hasFirstPlayer && gameRoom.players.size === 1) {
            gameRoom.hasFirstPlayer = true;
            console.log(`⏰ Первый игрок подключился к игре ${gameId}. Таймер запустится через 10 секунд`);

            gameRoom.timer.startTimeout = setTimeout(() => {
                startGameTimer(gameId);
            }, 10000);
        }

        // Если таймер уже активен, отправляем текущее состояние новому игроку
        if (gameRoom.timer.active) {
            ws.send(JSON.stringify({
                type: 'timer_update',
                timeLeft: gameRoom.timer.timeLeft,
                totalTime: gameRoom.timer.totalTime,
                active: true
            }));
        }

        // Уведомляем всех о новом подключении
        broadcastToGame(gameId, {
            type: 'player_joined',
            playerId,
            isHost: playerId === gameRoom.hostId,
            playersCount: gameRoom.players.size,
            message: `🎮 Игрок ${playerId} присоединился к игре`
        });

        console.log(`👤 Игрок ${playerId} присоединился к игре ${gameId} (${isHost ? 'Хост' : 'Игрок'})`);
    }

    function handleChatMessage(ws, gameId, playerId, text) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom) return;

        const player = gameRoom.players.get(playerId);
        if (!player) return;

        // Отправляем сообщение чата всем в игре
        broadcastToGame(gameId, {
            type: 'chat_message',
            playerId,
            text,
            timestamp: new Date().toISOString(),
            isHost: player.isHost
        });

        console.log(`💬 Игрок ${playerId} в игре ${gameId}: ${text}`);
    }

    function handlePlayerDisconnect(ws) {
        if (!ws.gameId || !ws.playerId) return;

        const gameId = ws.gameId; // Исправлено: используем ws.gameId
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom) return;

        const player = gameRoom.players.get(ws.playerId);
        if (player) {
            player.connected = false;

            // Уведомляем об отключении
            broadcastToGame(gameId, {
                type: 'player_disconnected',
                playerId: ws.playerId,
                message: `🔌 Игрок ${ws.playerId} отключился`
            });

            console.log(`🚪 Игрок ${ws.playerId} отключился от игры ${gameId}`);
        }

        // Если все игроки отключились, останавливаем таймер
        const connectedPlayers = Array.from(gameRoom.players.values()).filter(p => p.connected);
        if (connectedPlayers.length === 0) {
            stopGameTimer(gameId);
            if (gameRoom.timer.startTimeout) {
                clearTimeout(gameRoom.timer.startTimeout);
                gameRoom.timer.startTimeout = null;
            }
            gameRoom.hasFirstPlayer = false;
        }
    }

    // Очистка пустых комнат
    setInterval(() => {
        for (const [gameId, gameRoom] of gameRooms.entries()) {
            const connectedPlayers = Array.from(gameRoom.players.values()).filter(p => p.connected);
            if (connectedPlayers.length === 0) {
                stopGameTimer(gameId);
                if (gameRoom.timer.startTimeout) {
                    clearTimeout(gameRoom.timer.startTimeout);
                }
                gameRooms.delete(gameId);
                console.log(`🧹 Очищена пустая игровая комната ${gameId}`);
            }
        }
    }, 60000);
}

module.exports = { setupGameWebSocket };