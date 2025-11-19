const request = require('supertest');
const express = require('express');
const mapsRouter = require('../src/routes/maps');

jest.mock('../src/db/prismaClient', () => ({
  maps: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
}));

const prisma = require('../src/db/prismaClient');

const app = express();
app.use(express.json());
app.use('/api/maps', mapsRouter);


describe('Map List API', () => {
  afterEach(() => jest.clearAllMocks());

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

  test('GET /api/maps — 404 (карты не найдены)', async () => {
    prisma.maps.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/maps');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Карты не найдены');
    expect(res.body.code).toBe(404);
  });

  test('GET /api/maps — 500 (ошибка сервера)', async () => {
    prisma.maps.findMany.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/maps');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Ошибка сервера при получении списка карт');
    expect(res.body.code).toBe(500);
  });
});

describe('Map Info API', () => {
  afterEach(() => jest.clearAllMocks());

  test('GET /api/maps/:id_map — позитивное тестирование', async () => {
    prisma.maps.findUnique.mockResolvedValue({
      id: 1,
      name: 'Test Map',
      description: 'Some description',
      hp: 100,
      max_players: 10,
      picture_url: '/img/test.png',
    });

    const res = await request(app).get('/api/maps/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      name: 'Test Map',
      description: 'Some description',
      hp: 100,
      max_players: 10,
      picture_url: '/img/test.png',
    });
  });

  test('GET /api/maps/:id_map — 404 (карта не найдена)', async () => {
    prisma.maps.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/maps/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Карта не найдена');
    expect(res.body.code).toBe(404);
  });

  test('GET /api/maps/:id_map — 500 (ошибка сервера)', async () => {
    prisma.maps.findUnique.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/maps/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Ошибка сервера при получении карты');
    expect(res.body.code).toBe(500);
  });
});