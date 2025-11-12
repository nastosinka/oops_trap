const request = require('supertest');
const express = require('express');
const statsRouter = require('../src/routes/stats');

jest.mock('../src/db/prismaClient', () => ({
  stats: {
    findMany: jest.fn(),
  },
}));

const prisma = require('../src/db/prismaClient');

const app = express();
app.use(express.json());
app.use('/api/stats', statsRouter);

describe('Stats API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // Тесты для GET /api/stats/:id_user
  // -----------------------------
  test('GET /api/stats/:id_user — позитивное тестирование', async () => {
    prisma.stats.findMany.mockResolvedValue([
      { id_map: 1, time: 36, role: true },
      { id_map: 2, time: 123, role: false },
    ]);

    const res = await request(app).get('/api/stats/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { map_id: 1, best_time: 36, role: 'runner' },
      { map_id: 2, best_time: 123, role: 'trapper' },
    ]);
  });

  test('GET /api/stats/:id_user — 404 (статистика не найдена)', async () => {
    prisma.stats.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/stats/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Статистика для данного пользователя не найдена');
  });

  test('GET /api/stats/:id_user — 500 (произошла ошибка)', async () => {
    prisma.stats.findMany.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/stats/1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Ошибка сервера при получении статистики');
  });

  // -----------------------------
  // Тесты для GET /api/stats/map/:id_map
  // -----------------------------
  test('GET /api/stats/map/:id_map — позитивное тестирование', async () => {
    prisma.stats.findMany.mockResolvedValue([
      { id_map: 1, time: 42, role: true },
      { id_map: 1, time: 60, role: false },
    ]);

    const res = await request(app).get('/api/stats/map/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { map_id: 1, best_time: 42, role: 'runner' },
      { map_id: 1, best_time: 60, role: 'trapper' },
    ]);
  });

  test('GET /api/stats/map/:id_map — 404 (статистика не найдена)', async () => {
    prisma.stats.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/stats/map/123');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Статистика для данного лобби не найдена');
  });

  test('GET /api/stats/map/:id_map — 500 (произошла ошибка)', async () => {
    prisma.stats.findMany.mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/api/stats/map/1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Ошибка сервера при получении статистики лобби');
  });
});
