const request = require('supertest');
const express = require('express');
const mapsRouter = require('../src/routes/map-list');

jest.mock('../src/db/prismaClient', () => ({
  maps: {
    findMany: jest.fn(),
  },
}));

const prisma = require('../src/db/prismaClient');

const app = express();
app.use(express.json());
app.use('/api/maps', mapsRouter);

describe('Map list API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET /api/maps — позитивное тестирование
  // -----------------------------
  test('GET /api/maps — позитивное тестирование', async () => {
    prisma.maps.findMany.mockResolvedValue([
      { id: 1, name: 'Map 1', description: 'Desc 1', hp: 100, max_players: 4, picture_url: 'url1' },
      { id: 2, name: 'Map 2', description: 'Desc 2', hp: 80, max_players: 6, picture_url: 'url2' },
    ]);

    const res = await request(app).get('/api/maps');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 1, name: 'Map 1', description: 'Desc 1', hp: 100, max_players: 4, picture_url: 'url1' },
      { id: 2, name: 'Map 2', description: 'Desc 2', hp: 80, max_players: 6, picture_url: 'url2' },
    ]);
  });

  // -----------------------------
  // GET /api/maps — 404 (карты не найдены)
  // -----------------------------
  test('GET /api/maps — 404 (карты не найдены)', async () => {
    prisma.maps.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/maps');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Карты не найдены');
    expect(res.body.code).toBe(404);
  });

  // -----------------------------
  // GET /api/maps — 500 (ошибка сервера)
  // -----------------------------
  test('GET /api/maps — 500 (ошибка сервера)', async () => {
    prisma.maps.findMany.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/maps');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Ошибка сервера при получении списка карт');
    expect(res.body.code).toBe(500);
  });
});
