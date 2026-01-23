const request = require('supertest');
const express = require('express');

jest.mock('../src/middleware/auth', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = { id: 1 };
    next();
  }),
}));

jest.mock('../src/db/prismaClient', () => ({
  stats: { findMany: jest.fn() },
}));

const prisma = require('../src/db/prismaClient');
const statsRouter = require('../src/routes/stats');

describe('Stats API', () => {
  let app;
  const auth = require('../src/middleware/auth');

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/stats', statsRouter);

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

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

  test('GET /api/stats/:id_user — пустая статистика', async () => {
    prisma.stats.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/stats/999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET /api/stats/:id_user — 500 (ошибка базы)', async () => {
    prisma.stats.findMany.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/stats/1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Ошибка сервера при получении статистики');
  });
});
