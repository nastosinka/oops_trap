const WebSocket = require('ws');
const fs = require("fs");
const path = require("path");

function pointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;

        // Проверка пересечения луча с ребром
        const intersect = ((yi > y) !== (yj > y)) &&
                          (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi); 
        // + маленькая поправка чтобы не делить на ноль

        if (intersect) inside = !inside;
    }
    console.log(`pointInPolygon: x=${x}, y=${y}, inside=${inside}`);
    return inside;
}

// Проверка всех boundary полигонов
function isInsideBoundaries(x, y, polygons) {
    for (const poly of polygons) {
        if (poly.type === "boundary") {
            console.log("Checking boundary polygon:", poly.points);
            if (pointInPolygon(x, y, poly.points)) {
                console.log(`❌ Point ${x},${y} is inside polygon`);
                return true;
            }
        }
    }
    return false;
}

const gameRooms = new Map();

const { lobbies, games } = require('./../routes/lobby');

function validateCoord(lastSettings, settings){
    //+ логика
    return true;
}

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

                //тут получать стату
            }
        }, 1000);
    }

    wss.on('connection', (ws) => {
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log('📨 Сообщение в игре:', message);

                switch (message.type) {
                    case 'init': // важное наследие
                    case 'init': // важное наследие
                        handleInitGame(ws, message.gameId, message.playerId, message.isHost);
                        break;
                    case 'chat_message': // наследие чата
                    case 'chat_message': // наследие чата
                        handleChatMessage(ws, message.gameId, message.playerId, message.text);
                        break;
                    case 'died': // игрок умер (готово)
                        handlePlayerDied(ws, message.gameId, message.playerId, message.text);
                        break;
                    case 'win': // игрок победил (не готово)
                        handlePlayerWin(ws, message.gameId, message.playerId, message.text);
                        break;
                    case 'stats': // получить статистику по игре (не готово)
                        handleStats(ws, message.gameId);
                        break;
                    case 'coord_message': // поменять координаты игрока (проверено работает)
                        handleCoordMessage(ws, message.gameId, message.playerId, message.settings); 
                        break;
                    case 'died': // игрок умер (готово)
                        handlePlayerDied(ws, message.gameId, message.playerId, message.text);
                        break;
                    case 'win': // игрок победил (не готово)
                        handlePlayerWin(ws, message.gameId, message.playerId, message.text);
                        break;
                    case 'stats': // получить статистику по игре (не готово)
                        handleStats(ws, message.gameId);
                        break;
                    case 'coord_message': // поменять координаты игрока (проверено работает)
                        handleCoordMessage(ws, message.gameId, message.playerId, message.settings); 
                        break;
                    case 'player_move':
                        handlePlayerMove(ws, message.gameId, message.playerId, { 
                                                                x: message.position?.x, 
                                                                y: message.position?.y 
                                                            });
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
                hasFirstPlayer: false,
                playersWithSettings: new Map(),
                hasFirstPlayer: false,
                playersWithSettings: new Map(),
            };
            gameRooms.set(gameId, gameRoom);
        }
        //добавление "пустых" объектов игроков при создании игры
        // if (!gameRoom.playersWithSettings.has(playerId)) {
        //     gameRoom.playersWithSettings.set(playerId, {
        //         name: "Unknown",
        //         x: 100,
        //         y: 100,
        //         trapper: false,
        //         alive: true,
        //         time: null,
        //         lastImage: null,
        //     });
        //     console.log(`Добавили игрока ${playerId} в playersWithSettings`);
        // }
        
        if (!gameRoom.polygons) {
            try {
                const mapName = "map_test"
                //const mapName = gameRoom.mapName || "map_test";
                const filePath = path.join(__dirname, "../../data", `${mapName}.json`);

                const polygonsData = JSON.parse(fs.readFileSync(filePath));
                gameRoom.polygons = polygonsData.polygons;

                console.log(`🗺️ Полигоны карты "${mapName}"`);
            } catch (e) {
                console.error("❌ Ошибка загрузки полигона:", e);
            }
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
            connected: true,
            connected: true,
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
                const game = games.get(parseInt(gameId));
                if (!game) {
                    //+ логика, игра не найдена
                    return;
                }

                for (let i = 0; i < game.players.length; i++) {
                    const player = game.players[i];
                    console.log(player);
                    gameRoom.playersWithSettings.set(player['id'], {
                        name: player['name'], 
                        x: 100,
                        y: 100,
                        trapper: false,
                        alive: true,
                        time: null,
                        lastImage: null,
                    });
            }
            console.log(`Хранение координат инициализировано`);
            console.log(gameRoom.playersWithSettings);
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

        broadcastToGame(gameId, {
            type: 'chat_message',
            playerId,
            text,
            timestamp: new Date().toISOString(),
            isHost: player.isHost
        });

        console.log(`💬 Игрок ${playerId} в игре ${gameId}: ${text}`);
    }

    function handleCoordMessage(ws, gameId, playerId, settings) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom) return;

        const player = gameRoom.playersWithSettings.get(playerId);
        if (!player) return;

        // Только если координаты корректны — применяем в playersWithSettings
        if (settings && typeof settings.x === 'number' && typeof settings.y === 'number') {
            if (validateCoord(gameRoom.playersWithSettings, settings) === true) {
                player.x = settings.x;
                player.y = settings.y;
                player.lastImage = settings.lastImage;
            }
        } else {
            // Если settings некорректен, просто логируем
            console.log(`handleCoordMessage: invalid settings from player ${playerId}`, settings);
        }

        const playersArray = Array.from(gameRoom.playersWithSettings.entries()).map(([id, player]) => ({
            id: id,
            ...player
        }));

        broadcastToGame(gameId, {
            type: 'coord_message',
            playerId,
            coords: playersArray,
            timestamp: new Date().toISOString(),
            isHost: player.isHost,
        });

        console.log(`Координаты отправлены`);
        console.log(playersArray);
    }

    function handlePlayerMove(ws, gameId, playerId, position) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom) return;

        const player = gameRoom.playersWithSettings.get(playerId);
        //console.log("Проверяем player:", player);
        if (!player) return;

        const polygons = gameRoom.polygons;
        console.log("Player trying to move to:", position.x, position.y);

        // Проверка границы
        if (isInsideBoundaries(position.x, position.y, polygons)) {
            console.log(`❌ Игрок ${playerId} ударился о стену`);
            ws.send(JSON.stringify({
                type: "rollback",
                x: player.x,
                y: player.y,
                playerId
            }));
            return;
        }

        // Обновляем позиции
        player.x = position.x;
        player.y = position.y;

        // Отправляем всем
        const playersArray = Array.from(gameRoom.playersWithSettings.entries()).map(([id, p]) => ({
            id,
            ...p
        }));

        broadcastToGame(gameId, {
            type: "coord_message",
            playerId,
            timestamp: new Date().toISOString(),
            coords: playersArray
        });
    }

    function handlePlayerDied(ws, gameId, playerId, text) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom) return;

        const player = gameRoom.playersWithSettings.get(playerId);
        if (!player) return;

        player.alive = false;

        broadcastToGame(gameId, {
            type: 'died',
            playerId,
            text,
            timestamp: new Date().toISOString(),
            isHost: player.isHost,
        });
        console.log(gameRoom);
        console.log(`💬 Игрок ${playerId} в игре ${gameId}: ${text}`);
    }


    function handleStats(gameId) {
     const stats = game.players.map((player) => ({
         userId: player.id,
         role: true,
            time: 12, 
            result: Math.random() > 0.5 ? 1 : 0, // пример результата
            map: game.map
        }));
        // + логика получения статистики из gameRoom
        
        
        const game = games.get(parseInt(gameId));
        if (!game) {
                    //+ логика, игра не найдена
            return;
        }
        game.stats = stats;


        broadcastToGame(gameId, {
            type: 'stats',
            stats: stats,
            timestamp: new Date().toISOString()
        });
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
