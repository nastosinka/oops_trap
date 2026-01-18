const WebSocket = require('ws');
const prisma = require('../db/prismaClient');
const fs = require("fs");
const path = require("path");

const coordIntervals = new Map();

const HITBOX = {
  offsetX: 6,
  offsetY: 10,
  width: 12,
  height: 32,
};

function pointInPolygon(x, y, points) {
    const testPoints = [
        // центр
        {
            x: x + HITBOX.offsetX + HITBOX.width / 2,
            y: y + HITBOX.offsetY + HITBOX.height / 2,
        },

        // верх
        {
            x: x + HITBOX.offsetX + HITBOX.width / 2,
            y: y + HITBOX.offsetY,
        },

        // низ
        {
            x: x + HITBOX.offsetX + HITBOX.width / 2,
            y: y + HITBOX.offsetY + HITBOX.height,
        },

        // лево
        {
            x: x + HITBOX.offsetX,
            y: y + HITBOX.offsetY + HITBOX.height / 2,
        },

        // право
        {
            x: x + HITBOX.offsetX + HITBOX.width,
            y: y + HITBOX.offsetY + HITBOX.height / 2,
        },
    ];

    for (const p of testPoints) {
        let inside = false;

        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;

            const intersect =
                (yi > p.y) !== (yj > p.y) &&
                (p.x < (xj - xi) * (p.y - yi) / (yj - yi + 1e-7) + xi);

            if (intersect) inside = !inside;
        }

        if (inside) return true;
    }

    return false;
}


// Проверка всех boundary полигонов
function isInsideBoundaries(x, y, polygons) {
    for (const poly of polygons) {
        if (poly.type === "boundary") {
            //console.log("Checking boundary polygon:", poly.points);
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
        if (poly.name === "finish") {
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
//const { console } = require('inspector'); // ❌❌РАСКОММЕНТИТЬ ЧТОБЫ УБРАТЬ ЛОГИ❌❌

function validateCoord(lastSettings, settings) {
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

    function broadcastToGame(gameId, message) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom) return;

        gameRoom.players.forEach(player => {
            try {
                if (player.connected && player.ws.readyState === player.ws.OPEN) {
                    player.ws.send(JSON.stringify(message));
                }
            } catch (e) {
                console.error('❌ Ошибка отправки WS:', e);
            }
        });
    }

    async function finalizeGame(gameId) {
        console.log("Game finish");
        const gameRoom = gameRooms.get(gameId);
        const game = games.get(parseInt(gameId));
        if (!gameRoom || !game) return;

        if (gameRoom.finished) return;
        gameRoom.finished = true;

        if (!game.stats) {
            game.stats = new Map();
        }

        const players = Array.from(gameRoom.playersWithSettings.entries());

        const runners = players.filter(([id, p]) => !p.trapper);
        const mafiaId = game.trapper;

        const anyRunnerFinished = runners.some(([_, p]) => p.alive === null);

        // --- RUNNERS ---
        for (const [id, p] of runners) {
            if (!game.stats.has(id)) {
            game.stats.set(id, {
                name: p.name,
                role: 'runner',
                win: false,
                time: null,
                map: game.map
            });}
        }

        // --- MAFIA ---
        const mafiaWin = !anyRunnerFinished;
        if (mafiaWin){
            saveStatistic({ id_user: mafiaId, id_map: game.map, time: gameRoom.timer.totalTime - gameRoom.timer.timeLeft, role: false});
        }
        game.stats.set(mafiaId, {
            name: game.players.find(p => p.id === mafiaId)?.name,
            role: 'mafia',
            win: mafiaWin,
            time: mafiaWin
            ? gameRoom.timer.totalTime - gameRoom.timer.timeLeft
            : null,
            map: game.map
        });

        const lobby = lobbies.get(parseInt(gameId));
        if (lobby) {
            lobby.status = "finished";
            console.log(`🏁 Лобби ${gameId} помечено как finished`);
        }

        broadcastToGame(gameId, {
            type: 'all_stats',
            stats: Object.fromEntries(game.stats),
        });
    }

    async function stopGameTimer(gameId) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom || !gameRoom.timer.active) return;

        if (gameRoom.timer.interval) {
            clearInterval(gameRoom.timer.interval);
            gameRoom.timer.interval = null;
        }

        gameRoom.timer.active = false;
        console.log(`⏹️ Таймер остановлен для игры ${gameId}`);

        if (!gameRoom.finished) {
            await finalizeGame(gameId);
        }

        // Закрываем все соединения в комнате
        gameRoom.players.forEach(async player => {
            if (player.connected && player.ws.readyState === player.ws.OPEN) {
                player.ws.close(1000, 'Game finished - time is up');
            }
        });

        // Удаляем комнату
        setTimeout(() => {
            gameRooms.delete(gameId);
        }, 500);
        console.log(`🎯 Игра ${gameId} завершена, комната удалена`);
    }

    async function checkAllRunnersDone(gameId) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom || gameRoom.finished) return;

        const runners = [...gameRoom.playersWithSettings.values()]
            .filter(p => !p.trapper);

        const allDone = runners.every(
            p => p.alive === false || p.alive === null
        );

        if (!allDone) return;
        await finalizeGame(gameId);
        stopGameTimer(gameId);
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
        gameRoom.timer.interval = setInterval(async () => {
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
                await finalizeGame(gameId);
                stopGameTimer(gameId);
                console.log(`⏰ Время вышло для игры ${gameId}`);
            }
        }, 1000);
    }

    wss.on('connection', (ws) => {
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data);
                console.log('📨 Сообщение в игре:', message);

                switch (message.type) {
                    case 'init': // важное наследие
                        handleInitGame(ws, message.gameId, message.playerId, message.isHost);
                        break;
                    case 'player_move': // поменять координаты игрока (проверено работает)
                        handlePlayerMove(ws, message.gameId, message.playerId, message.settings);
                        break;
                    case 'trap_message': // активировать ловушку
                        handleTrapMessage(ws, message.gameId, message.trap, message.playerId);
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

    function handleTrapMessage(ws, gameId, trapName, playerId) {
        try {
            const gameRoom = gameRooms.get(gameId);
            if (!gameRoom || !Array.isArray(gameRoom.polygons)) return;
            const game = games.get(parseInt(gameId));
            if (!game) return;

            if (game.trapper !== playerId) return;

            const trap = gameRoom.polygons.find(p => p.name === trapName);
            if (!trap || typeof trap.timer !== 'number' || trap.isActive) return;

            trap.isActive = true;
            console.log(`Ловушка активирована ${trapName}`);
            broadcastToGame(gameId, {
                type: 'trap_message',
                name: trapName,
                time: trap.timer,
                result: true,
                timestamp: new Date().toISOString()
            });

            gameRoom.playersWithSettings.forEach((player, playerId) => {
                console.log("Запущена проверка попадания всех игроков в ловушки");
                const trapType = checkTrapCollision(player.x, player.y, gameRoom.polygons);
                if (trapType) {
                    player.alive = false;
                    broadcastToGame(gameId, {
                        type: "died",
                        playerId: playerId,
                        reason: trapType,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`☠️ Игрок ${playerId} погиб от ${trapType}`);
                }
            });
            checkAllRunnersDone(gameId);

            setTimeout(() => {
                try {
                    trap.isActive = false;
                    broadcastToGame(gameId, {
                        type: 'trap_message',
                        name: trapName,
                        time: trap.timer,
                        result: false,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`Ловушка дезактивирована ${trapName}`);
                } catch (e) {
                    console.error('❌ Ошибка деактивации ловушки', e);
                }
            }, trap.timer*1000);

        } catch (error) {
            console.error('❌ Ошибка в handleTrapMessage:', error);
        }
    }


    async function handleInitGame(ws, gameId, playerId, isHost) {
        try {
            let gameRoom = gameRooms.get(gameId);

            if (!gameRoom) {
                let lobby = lobbies.get(parseInt(gameId));
                const map = await prisma.maps.findUnique({
                    where: { id: lobby.map },
                    select: {
                        time_1: true,
                        time_2: true,
                        time_3: true,
                    },
                });

                if (lobby.time === "easy") {
                    gameRoom = {
                        players: new Map(),
                        hostId: null,
                        timer: {
                            active: false,
                            timeLeft: map.time_1,
                            interval: null,
                            totalTime: map.time_1,
                            startTimeout: null
                        },
                        hasFirstPlayer: false,
                        playersWithSettings: new Map(),
                        finished: false
                    };

                }
                if (lobby.time === "normal") {
                    gameRoom = {
                        players: new Map(),
                        hostId: null,
                        timer: {
                            active: false,
                            timeLeft: map.time_2,
                            interval: null,
                            totalTime: map.time_2,
                            startTimeout: null
                        },
                        hasFirstPlayer: false,
                        playersWithSettings: new Map(),
                        finished: false
                    };
                }
                if (lobby.time === "hard") {
                    gameRoom = {
                        players: new Map(),
                        hostId: null,
                        timer: {
                            active: false,
                            timeLeft: map.time_3,
                            interval: null,
                            totalTime: map.time_3,
                            startTimeout: null
                        },
                        hasFirstPlayer: false,
                        playersWithSettings: new Map(),
                        finished: false
                    };
                }

                console.log(gameRoom.timer.totalTime);
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
                    let game = games.get(parseInt(gameId));
                    console.log(game);
                    if (!gameRoom.polygons) {
                        try {
                            const mapName = game.map;
                            const filePath = path.join(__dirname, "../../data", `map${mapName}.json`);

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
                        if (game.trapper === player['id']) {
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
        } catch (error) {
            console.error('❌ Ошибка в handleInitGame:', error);
        }
    }

    function handlePlayerMove(ws, gameId, playerId, settings) {
        const gameRoom = gameRooms.get(gameId);
        if (!gameRoom || !gameRoom.polygons) return;

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
                let finish = checkFinishCollision(settings.x, settings.y, polygons);
                if (finish) {
                    player.alive = null;
                    const game = games.get(parseInt(gameId));
                    game.stats.set(playerId, {
                        name: player.name,
                        role: 'runner',
            win: true,
            time: gameRoom.timer.totalTime - gameRoom.timer.timeLeft,
            map: game.map,
        });
        console.log(game);
        saveStatistic({ id_user: playerId, id_map: game.map, time: gameRoom.timer.totalTime - gameRoom.timer.timeLeft, role: true});
        console.log(game.stats); // добавить при попадании в полигон финиша тут чисто чтобы показать
                    console.log(`Игрок ${playerId} достиг финиша и выиграл`);
                    checkAllRunnersDone(gameId);
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
                    checkAllRunnersDone(gameId);
                    console.log(`☠️ Игрок ${playerId} погиб от ${trapType}`);
                    checkAllRunnersDone(gameId);
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

        if (ws.playerId === gameRoom.hostId) {
            const lobby = lobbies.get(parseInt(gameId));
            if (lobby && lobby.status === "finished") {
                lobby.status = "waiting";
                console.log(`🔁 Host left finished game → lobby ${gameId} waiting`);
            }
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
                setTimeout(() => {
                    gameRooms.delete(gameId);
                }, 500);

                console.log(`🧹 Очищена пустая игровая комната ${gameId}`);
            }
        }
    }, 60000);
}



module.exports = { setupGameWebSocket };
