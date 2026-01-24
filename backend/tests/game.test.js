beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

jest.useFakeTimers();

/* ========
   MOCK WS
======== */
jest.mock('ws', () => {
    const EventEmitter = require('events');

    class MockWebSocket extends EventEmitter {
        constructor() {
            super();
            this.send = jest.fn();
            this.close = jest.fn();
            this.readyState = 1;
            this.OPEN = 1;
        }
    }

    return {
        Server: jest.fn(() => {
            const server = new EventEmitter();
            server.handleUpgrade = jest.fn((req, socket, head, cb) => {
                cb(new MockWebSocket());
            });
            return server;
        }),
    };
});

/* ========
   MOCK FS
======== */
const fs = require('fs');

jest.mock('fs', () => ({
    readFileSync: jest.fn(() =>
        JSON.stringify({
            polygons: [
                {
                    type: 'spawn',
                    points: [
                        { x: 0, y: 0 },
                        { x: 10, y: 0 },
                        { x: 10, y: 10 },
                        { x: 0, y: 10 },
                    ],
                },
            ],
        })
    ),
}));

/* ========
   MOCK PRISMA
======== */
jest.mock('../src/db/prismaClient', () => ({
    maps: {
        findUnique: jest.fn(async () => ({
            time_1: 60,
            time_2: 90,
            time_3: 120,
        })),
    },
    stats: {
        findFirst: jest.fn(async () => null),
        create: jest.fn(async ({ data }) => ({ id: 1, ...data })),
        update: jest.fn(async ({ data }) => ({ id: 1, ...data })),
    },
}));

/* ========
   MOCK LOBBIES / GAMES
======== */
jest.mock('../src/routes/lobby', () => {
    const lobbies = new Map();
    const games = new Map();

    lobbies.set(1, {
        map: 1,
        time: 'easy',
        status: 'waiting',
    });

    games.set(1, {
        map: 1,
        trapper: 2,
        players: [
            { id: 1, name: 'Runner' },
            { id: 2, name: 'Mafia' },
        ],
        stats: new Map(),
    });

    return { lobbies, games };
});

/* ========
   IMPORT GAME
======== */
const WebSocket = require('ws');
const { setupGameWebSocket } = require('../src/websockets/game');
const EventEmitter = require('events');

/* ========
   HELPERS
======== */
function createServerAndWS() {
    const server = { on: jest.fn() };
    setupGameWebSocket(server);

    const upgradeHandler = server.on.mock.calls[0][1];

    const req = { url: '/ws/game/1', headers: { host: 'localhost' } };
    const socket = { write: jest.fn(), destroy: jest.fn() };

    upgradeHandler(req, socket, Buffer.alloc(0));

    const wss = WebSocket.Server.mock.results[0].value;
    const ws = new EventEmitter();
    ws.send = jest.fn();
    ws.close = jest.fn();
    ws.readyState = 1;
    ws.OPEN = 1;

    wss.emit('connection', ws);
    return ws;
}

/* ========
   TESTS
======== */
describe('game.js websocket logic (combined)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    test('init: создаётся WebSocket сервер', () => {
        const server = { on: jest.fn() };
        setupGameWebSocket(server);

        expect(WebSocket.Server).toHaveBeenCalled();
        expect(server.on).toHaveBeenCalledWith('upgrade', expect.any(Function));
    });

    test('init + старт таймера + spawn', () => {
        const ws = createServerAndWS();

        ws.emit(
            'message',
            JSON.stringify({ type: 'init', gameId: 1, playerId: 1, isHost: true })
        );

        expect(() => {
            jest.advanceTimersByTime(10_000);
        }).not.toThrow();
    });


    test('player_move: обычное движение', () => {
        const ws = createServerAndWS();

        ws.emit('message', JSON.stringify({ type: 'init', gameId: 1, playerId: 1, isHost: true }));
        jest.advanceTimersByTime(10_000);

        ws.emit(
            'message',
            JSON.stringify({
                type: 'player_move',
                gameId: 1,
                playerId: 1,
                settings: { x: 3, y: 3 },
            })
        );

        expect(ws.send).toHaveBeenCalled();
    });

    test('player_move: boundary не ломает игру', () => {
        fs.readFileSync.mockReturnValueOnce(
            JSON.stringify({
                polygons: [
                    {
                        type: 'boundary',
                        points: [
                            { x: 0, y: 0 },
                            { x: 20, y: 0 },
                            { x: 20, y: 20 },
                            { x: 0, y: 20 },
                        ],
                    },
                ],
            })
        );

        const ws = createServerAndWS();

        ws.emit(
            'message',
            JSON.stringify({ type: 'init', gameId: 1, playerId: 1, isHost: true })
        );

        jest.advanceTimersByTime(10_000);

        expect(() => {
            ws.emit(
                'message',
                JSON.stringify({
                    type: 'player_move',
                    gameId: 1,
                    playerId: 1,
                    settings: { x: 5, y: 5 },
                })
            );
        }).not.toThrow();
    });



    test('trap_message: активация ловушки', () => {
        fs.readFileSync.mockReturnValueOnce(
            JSON.stringify({
                polygons: [
                    {
                        type: 'trap',
                        name: 'spike1',
                        timer: 1,
                        isActive: false,
                        points: [
                            { x: 0, y: 0 },
                            { x: 20, y: 0 },
                            { x: 20, y: 20 },
                            { x: 0, y: 20 },
                        ],
                    },
                ],
            })
        );

        const ws = createServerAndWS();
        ws.emit('message', JSON.stringify({ type: 'init', gameId: 1, playerId: 2, isHost: false }));
        jest.advanceTimersByTime(10_000);

        ws.emit(
            'message',
            JSON.stringify({
                type: 'trap_message',
                gameId: 1,
                trap: 'spike1',
                playerId: 2,
            })
        );

        expect(ws.send).toHaveBeenCalled();
    });

    test('finish: игрок достигает финиша', () => {
        fs.readFileSync.mockReturnValueOnce(
            JSON.stringify({
                polygons: [
                    {
                        name: 'finish',
                        type: 'finish',
                        points: [
                            { x: 0, y: 0 },
                            { x: 20, y: 0 },
                            { x: 20, y: 20 },
                            { x: 0, y: 20 },
                        ],
                    },
                ],
            })
        );

        const ws = createServerAndWS();
        ws.emit('message', JSON.stringify({ type: 'init', gameId: 1, playerId: 1, isHost: true }));
        jest.advanceTimersByTime(10_000);

        ws.emit(
            'message',
            JSON.stringify({
                type: 'player_move',
                gameId: 1,
                playerId: 1,
                settings: { x: 5, y: 5 },
            })
        );

        expect(ws.send).toHaveBeenCalled();
    });

    test('disconnect: код не падает', () => {
        const ws = createServerAndWS();
        ws.gameId = 1;
        ws.playerId = 1;

        expect(() => ws.emit('close')).not.toThrow();
    });

    test('таймеры: advanceTimers не ломает игру', () => {
        createServerAndWS();
        expect(() => jest.advanceTimersByTime(60_000)).not.toThrow();
    });

    test('несколько игроков: broadcast не падает', () => {
        const ws1 = createServerAndWS();
        const ws2 = createServerAndWS();

        ws1.emit('message', JSON.stringify({ type: 'init', gameId: 1, playerId: 1, isHost: true }));
        ws2.emit('message', JSON.stringify({ type: 'init', gameId: 1, playerId: 2, isHost: false }));

        expect(() => {
            ws1.emit(
                'message',
                JSON.stringify({
                    type: 'player_move',
                    gameId: 1,
                    playerId: 1,
                    settings: { x: 2, y: 2 },
                })
            );
        }).not.toThrow();
    });
    
    test('неизвестный тип сообщения не ломает сервер', () => {
        const ws = createServerAndWS();

        ws.emit(
            'message',
            JSON.stringify({
                type: 'unknown_event_type',
                gameId: 1,
                playerId: 1,
            })
        );

        expect(ws.send).not.toHaveBeenCalled();
    });

    test('повторный init одного игрока не ломает игру', () => {
        const ws = createServerAndWS();

        ws.emit('message', JSON.stringify({ type: 'init', gameId: 1, playerId: 1, isHost: true }));
        ws.emit('message', JSON.stringify({ type: 'init', gameId: 1, playerId: 1, isHost: true }));

        expect(() => {
            jest.advanceTimersByTime(10_000);
        }).not.toThrow();
    });
});

afterAll(() => {
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
});