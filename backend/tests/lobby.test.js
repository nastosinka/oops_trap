const request = require('supertest');
const express = require('express');

jest.spyOn(global, 'setInterval').mockImplementation(() => 0);
jest.spyOn(global, 'setTimeout').mockImplementation(() => 0);

jest.mock('../src/middleware/auth', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = { id: 1 };
    next();
  }),
}));

jest.mock('../src/db/prismaClient', () => ({
  user: { findUnique: jest.fn() },
  maps: { findMany: jest.fn().mockResolvedValue([]) },
}));

const prisma = require('../src/db/prismaClient');
const lobbyRouter = require('../src/routes/lobby');

describe('Lobby API (auth-based)', () => {
  let app;

  const auth = require('../src/middleware/auth');

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/lobby', lobbyRouter);

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    lobbyRouter.lobbies.clear();
    lobbyRouter.games.clear();
  });

  afterAll(() => {
    global.setInterval.mockRestore();
    global.setTimeout.mockRestore();

    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  /* ================== TESTS ================== */
  describe('POST /newlobby', () => {
    it('creates lobby for authenticated user', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 1, name: 'Owner' });
      const res = await request(app).post('/api/lobby/newlobby');
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('fails if user not found', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      const res = await request(app).post('/api/lobby/newlobby');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('fails if user already in another lobby', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, name: 'Owner' });
      await request(app).post('/api/lobby/newlobby');
      const res = await request(app).post('/api/lobby/newlobby');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already in another lobby');
    });

    it('returns 500 on prisma error', async () => {
      prisma.user.findUnique.mockRejectedValueOnce(new Error('DB error'));
      const res = await request(app).post('/api/lobby/newlobby');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  describe('POST /lobbies/:id/join', () => {
    it('allows another authenticated user to join lobby', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 1, name: 'Owner' });
      const createRes = await request(app).post('/api/lobby/newlobby');
      const lobbyId = createRes.body.id;

      auth.requireAuth.mockImplementationOnce((req, res, next) => {
        req.user = { id: 2 };
        next();
      });
      prisma.user.findUnique.mockResolvedValueOnce({ id: 2, name: 'Player2' });

      const res = await request(app).post(`/api/lobby/lobbies/${lobbyId}/join`);
      expect(res.status).toBe(200);
      expect(res.body.lobby.playerCount).toBe(2);
    });

    it('fails if lobby not found', async () => {
      auth.requireAuth.mockImplementationOnce((req, res, next) => {
        req.user = { id: 2 };
        next();
      });
      const res = await request(app).post('/api/lobby/lobbies/999/join');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /lobbies/:id/leave', () => {
    it('removes user from lobby', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 1, name: 'Owner' });
      const createRes = await request(app).post('/api/lobby/newlobby');
      const lobbyId = createRes.body.id;

      auth.requireAuth.mockImplementationOnce((req, res, next) => {
        req.user = { id: 2 };
        next();
      });
      prisma.user.findUnique.mockResolvedValueOnce({ id: 2, name: 'Player2' });
      await request(app).post(`/api/lobby/lobbies/${lobbyId}/join`);

      const res = await request(app).post(`/api/lobby/lobbies/${lobbyId}/leave`);
      expect(res.status).toBe(200);
      expect(res.body.lobby.playerCount).toBe(1);
    });

    it('fails if lobby not found', async () => {
      auth.requireAuth.mockImplementationOnce((req, res, next) => {
        req.user = { id: 2 };
        next();
      });
      const res = await request(app).post('/api/lobby/lobbies/999/leave');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /lobbies/:id/settings', () => {
    it('returns lobby settings', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 1, name: 'Owner' });
      const createRes = await request(app).post('/api/lobby/newlobby');
      const lobbyId = createRes.body.id;

      const res = await request(app).get(`/api/lobby/lobbies/${lobbyId}/settings`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', lobbyId);
      expect(res.body.data).toHaveProperty('status', 'waiting');
    });

    it('fails if lobby not found', async () => {
      const res = await request(app).get('/api/lobby/lobbies/999/settings');
      expect(res.status).toBe(404);
    });
  });
});
