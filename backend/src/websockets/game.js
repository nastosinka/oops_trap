const WebSocket = require('ws');
const prisma = require('../db/prismaClient');
const fs = require("fs");
const path = require("path");

const coordIntervals = new Map();


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

function checkTrapCollision(x, y, polygons) {
    for (const poly of polygons) {
        if (poly.type === "lava" || poly.type === "spike" || (poly.type === "trap" && poly.isActive === true)) {
            if (pointInPolygon(x, y, poly.points)) {
                console.log(`Trap collision (${poly.type}) at ${x},${y}`);
                return poly.type;
            }
        }
    }
    return null;
}

function getSpawnPoint(polygons) {
    if (!Array.isArray(polygons)) return null;

    const spawnPoly = polygons.find(p => p.type === "spawn");

    if (!spawnPoly || !Array.isArray(spawnPoly.points) || spawnPoly.points.length === 0) {
        return null;
    }

    const points = spawnPoly.points;

    const x =
        points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y =
        points.reduce((sum, p) => sum + p.y, 0) / points.length;

    return { x, y };
}

function checkFinishCollision(x, y, polygons) {
    for (const poly of polygons) {
        if (poly.type === "finish") {
            if (pointInPolygon(x, y, poly.points)) {
                console.log(`Finish collision (${poly.type}) at ${x},${y}`);
                return poly.type;
            }
        }
    }
    return null;
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
                        handleInitGame(ws, message.gameId, message.playerId, message.isHost);
                        break;
                    case 'chat_message': // наследие чата
                        handleChatMessage(ws, message.gameId, message.playerId, message.text);
                        break;
                    case 'all_stats': // получить статистику по игре (не готово)
                        handleAllStats(ws, message.gameId);
                        break;
                    case 'player_move': // поменять координаты игрока (проверено работает)
                        handlePlayerMove(ws, message.gameId, message.playerId, message.settings); 
                        break;
                    case 'coord_message': // получить координаты
                        handleCoordMessage(ws, message.gameId); 
                        break;
                    case 'trap_message': // активировать ловушку
                        handleTrapMessage(ws, message.gameId, message.trap); 
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

    function handleTrapMessage(ws, gameId, trapName) {
        let gameRoom = gameRooms.get(gameId);
        console.log(gameRoom.polygons);
        const trap = gameRoom.polygons.find(p => p.name === trapName);
        setTimeout(() => {
            trap['isActive'] = false;
            console.log("ловушка деактивирована");
            console.log(trap);
        }, trap.timer);
        trap['isActive'] = true;
        console.log("ловушка активирована");
        console.log(trap);


        broadcastToGame(gameId, {
            type: 'trap_message',
            result: true,
            timestamp: new Date().toISOString()
        });
    }

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
                if (!gameRoom.polygons) {
                    try {
                        const mapName = game.map;
                        const filePath = path.join(__dirname, "../../data", `${mapName}.json`);

                        const polygonsData = JSON.parse(fs.readFileSync(filePath));
                        gameRoom.polygons = polygonsData.polygons;

                        console.log(`🗺️ Полигоны карты "${mapName}"`);
                    } catch (e) {
                        console.error("❌ Ошибка загрузки полигона:", e);
                    }
                }
                const spawn = getSpawnPoint(gameRoom.polygons); ////// SPAWN COORDS - spawn.x spawn.y

                console.log(`Игрок заспавнится на координатах ${spawn.x} - - ${spawn.y}.`);
                
                if (!game) {
                    //+ логика, игра не найдена
                    return;
                }

                for (let i = 0; i < game.players.length; i++) {
                    const player = game.players[i];
                    console.log(player);
                    if (game.trapper === player['id']){
                        gameRoom.playersWithSettings.set(player['id'], {
                        name: player['name'], 
                        x: spawn.x,
                        y: spawn.y,
                        trapper: true,
                        alive: null,
                        time: null,
                        lastImage: null,
                    });
                    } else {
                    gameRoom.playersWithSettings.set(player['id'], {
                        name: player['name'], 
                        x: spawn.x,
                        y: spawn.y,
                        trapper: false,
                        alive: true,
                        time: null,
                        lastImage: null,
                    });
                }
            }
            console.log(`Хранение координат инициализировано`);
            console.log(gameRoom.playersWithSettings);
            handleTrapMessage(ws, gameId, "gas-trap");
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

    function handlePlayerMove(ws, gameId, playerId, settings) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom) return;

        const player = gameRoom.playersWithSettings.get(playerId);
        if (!player) return;

        if (player.alive != true) {
            return;
        }

        if (settings && typeof settings.x === "number" && typeof settings.y === "number") {
            if (validateCoord(gameRoom.playersWithSettings, settings) === true) {
                const polygons = gameRoom.polygons;

                if (isInsideBoundaries(settings.x, settings.y, polygons)) {
                    console.log(`❌ Игрок ${playerId} ударился о стену`);
                    ws.send(JSON.stringify({
                        type: "rollback",
                        x: player.x,
                        y: player.y,
                        playerId
                    }));
                    return;
                }

                const trapType = checkTrapCollision(settings.x, settings.y, polygons);
                if (trapType) {
                    player.alive = false;
                    broadcastToGame(gameId, {
                        type: "died",
                        playerId,
                        reason: trapType,
                        timestamp: new Date().toISOString()
                    });

                    console.log(`☠️ Игрок ${playerId} погиб от ${trapType}`);
                    return;
                }
                
                const finish = checkFinishCollision(settings.x, settings.y, polygons);
                if (finish) {
                    player.alive = null;
                    handleStats(ws, gameId, playerId); // добавить при попадании в полигон финиша тут чисто чтобы показать
                    broadcastToGame(gameId, {
                        type: "win",
                        playerId,
                        timestamp: new Date().toISOString()
                    });

                    console.log(`Игрок ${playerId} достиг финиша и выиграл`);
                    return;
                }

                player.x = settings.x;
                player.y = settings.y;
                player.lastImage = settings.lastImage;
            }
        } else {
            console.log(`handlePlayerMove: invalid settings from player ${playerId}`, settings);
        }

        const playersArray = Array.from(gameRoom.playersWithSettings.entries()).map(([id, player]) => ({
            id: id,
            ...player
        }));

        broadcastToGame(gameId, {
            type: 'player_move',
            coords: playersArray,
            timestamp: new Date().toISOString(),
        });

        console.log(`Координаты отправлены`);
        console.log(playersArray);
    }

function handleCoordMessage(ws, gameId, intervalMs = 100) {
    const gameRoom = gameRooms.get(gameId);
    if (!gameRoom) return;


    stopCoordBroadcast(gameId);

    const interval = setInterval(() => {
        const currentGameRoom = gameRooms.get(gameId);
        if (!currentGameRoom) {
            stopCoordBroadcast(gameId);
            return;
        }

        const playersArray = Array.from(currentGameRoom.playersWithSettings.entries()).map(([id, player]) => ({
            id: id,
            ...player
        }));

        broadcastToGame(gameId, {
            type: 'coord_message',
            coords: playersArray,
            timestamp: new Date().toISOString(),
        });

        console.log(`Координаты отправлены в ${new Date().toISOString()}`);
        console.log(playersArray);
    }, intervalMs);

    coordIntervals.set(gameId, interval);

    console.log(`Запущена периодическая отправка координатов для игры ${gameId} каждые ${intervalMs}мс`);
}

function stopCoordBroadcast(gameId) {
    if (coordIntervals.has(gameId)) {
        clearInterval(coordIntervals.get(gameId));
        coordIntervals.delete(gameId);
        console.log(`Остановлена отправка координатов для игры ${gameId}`);
    }
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


    function handleAllStats(ws, gameId) {
        const game = games.get(parseInt(gameId));
        if (!game) {
                    //+ логика, игра не найдена + проверка что игрок не траппер
            return;
        }

        broadcastToGame(gameId, {
            type: 'all_stats',
            stats: game.stats,
            timestamp: new Date().toISOString()
        });
    }

async function saveStatistic(data) {
  const { id_user, id_map, time, role } = data;

  // Валидация входных данных
  if (id_user === undefined || id_map === undefined || time === undefined || role === undefined) {
    throw {
      error: 'Обязательные поля: id_user, id_map, time, role',
    };
  }

  const userId = parseInt(id_user);
  const mapId = parseInt(id_map);
  const timeValue = parseInt(time);

  if (isNaN(userId) || isNaN(mapId) || isNaN(timeValue)) {
    throw {
      error: 'Поля id_user, id_map и time должны быть числами',
    };
  }

  if (typeof role !== 'boolean') {
    throw {
      error: 'Поле role должно быть булевым значением',
    };
  }

  try {
    // Проверка существующей статистики
    const existingStat = await prisma.stats.findFirst({
      where: {
        id_user: userId,
        id_map: mapId,
        role: role,
      },
    });

    let result;
    let action;

    if (existingStat) {
      if (existingStat.time > timeValue) {
        result = await prisma.stats.update({
          where: { id: existingStat.id },
          data: { time: timeValue },
        });
        action = 'updated';
        console.log('Статистика обновлена:', result);
      } else {
        console.log('Статистика не требует обновлений');
        result = existingStat;
        action = 'unchanged';
      }
    } else {
      result = await prisma.stats.create({
        data: {
          id_user: userId,
          id_map: mapId,
          time: timeValue,
          role: role,
        },
      });
      action = 'created';
      console.log('Новая статистика создана:', result);
    }

    // Форматирование результата
    const formattedResult = {
      id: result.id,
      id_user: result.id_user,
      id_map: result.id_map,
      time: result.time,
      role: result.role,
    };

    return {
      success: true,
      action: action,
      data: formattedResult,
    };

  } catch (error) {
    console.error('Ошибка при сохранении статистики:', error);

    if (error.code === 'P2003') {
      throw {
        error: 'Неверный id_user или id_map',
        details: 'Указанный пользователь или карта не существует'
      };
    }

    throw {
      error: 'Ошибка сервера при сохранении статистики',
      details: error.message
    };
  }
}

    function handleStats(ws, gameId, playerId) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom) return;
        const game = games.get(parseInt(gameId));
        if (!game) {
                    //+ логика, игра не найдена + проверка что игрок не траппер
            return;
        }
        game.stats.set(playerId, {
            time: gameRoom.timer.totalTime - gameRoom.timer.timeLeft,
            map: game.map,
            role: true,
        });
        saveStatistic({ id_user: playerId, id_map: game.map, time: gameRoom.timer.totalTime - gameRoom.timer.timeLeft, role: true});


        broadcastToGame(gameId, {
            type: 'stats',
            stats: game.stats,
            timestamp: new Date().toISOString()
        });
        console.log(game.stats);
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
