const request = require('supertest');
const express = require('express');
const mapInfoRouter = require('../src/routes/map-info');

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

jest.mock('../src/db/prismaClient', () => ({
  maps: {
    findUnique: jest.fn(),
  },
}));

const prisma = require('../src/db/prismaClient');

const app = express();
app.use(express.json());
app.use('/api/maps', mapInfoRouter);

describe('Map info API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET /api/maps/:id_map - позитивное тестирование
  // -----------------------------
  test('GET /api/maps/:id_map - позитивное тестирование', async () => {
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

  // -----------------------------
  // GET /api/maps/:id_map - 404 (карта не найдена)
  // -----------------------------
  test('GET /api/maps/:id_map - 404 (карта не найдена)', async () => {
    prisma.maps.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/maps/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Карта не найдена');
    expect(res.body.code).toBe(404);
  });

  // -----------------------------
  // GET /api/maps/:id_map - 500 (ошибка сервера)
  // -----------------------------
  test('GET /api/maps/:id_map - 500 (ошибка сервера)', async () => {
    prisma.maps.findUnique.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/maps/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Ошибка сервера при получении карты');
    expect(res.body.code).toBe(500);
  });
});

afterAll(() => {
  console.error.mockRestore();
});