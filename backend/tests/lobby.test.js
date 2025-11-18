const request = require('supertest');
const express = require('express');

jest.mock('../src/db/prismaClient', () => ({
  user: {
    findUnique: jest.fn(),
  },
  maps: {
    findMany: jest.fn(),
  },
}));

const prisma = require('../src/db/prismaClient');
const lobbyRouter = require('../src/routes/lobby');

const app = express();
app.use(express.json());
app.use('/api/lobby', lobbyRouter);

describe('Lobby API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (lobbyRouter.resetLobbies) {
        lobbyRouter.resetLobbies();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== ПОЗИТИВНЫЕ ТЕСТЫ ====================
  describe('Positive Tests', () => {
    it('should create a new lobby successfully with valid ownerId', async () => {
      const mockUser = { id: 1, name: 'TestUser' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 1 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('number');
      expect(res.body.id).toBeGreaterThan(0);
    });

    it('should create lobby with correct initial structure', async () => {
      const mockUser = { id: 1, name: 'TestUser' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 1 });

      const lobbyId = res.body.id;

      if (lobbyRouter.getLobbies) {
        const lobbies = lobbyRouter.getLobbies();
        const createdLobby = lobbies.get(lobbyId);
        
        expect(createdLobby).toBeDefined();
        expect(createdLobby).toMatchObject({
          id: lobbyId,
          ownerId: 1,
          status: 'waiting',
          map: null,
          players: [mockUser],
          trapper: null,
          time: 'normal'
        });
        expect(createdLobby.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should set creator as first player in lobby', async () => {
      const mockUser = { id: 1, name: 'TestUser' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 1 });

      const lobbyId = res.body.id;

      if (lobbyRouter.getLobbies) {
        const lobbies = lobbyRouter.getLobbies();
        const createdLobby = lobbies.get(lobbyId);
        
        expect(createdLobby.players).toHaveLength(1);
        expect(createdLobby.players[0]).toEqual(mockUser);
      }
    });
  });

  // ==================== НЕГАТИВНЫЕ ТЕСТЫ ====================
  describe('Negative Tests - Validation Errors', () => {
    it('should return 400 when ownerId is missing', async () => {
      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'ownerId is required'
      });
    });

    it('should return 400 when ownerId is null', async () => {
      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: null });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ownerId is required');
    });

    it('should return 400 when ownerId is undefined', async () => {
      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: undefined });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ownerId is required');
    });

    it('should return 400 when ownerId is empty string', async () => {
      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ownerId is required');
    });

    it('should return 404 when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: 'User not found'
      });
    });

    it('should return 400 when user is already in another lobby', async () => {
      const mockUser = { id: 1, name: 'TestUser' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 1 });

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'User already in another lobby'
      });
    });

    it('should return 400 when user is already in another lobby because he is owner other lobby', async () => {
      const mockUser1 = { id: 1, name: 'User1' };
      const mockUser2 = { id: 2, name: 'User2' };

      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser2)
        .mockResolvedValueOnce(mockUser1);

      const secondLobbyRes = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 2 });
      const secondLobbyId = secondLobbyRes.body.id;

      await request(app)
        .post(`/api/lobby/${secondLobbyId}/join`)
        .send({ userId: 1 });

      const lobbyRes = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 1 });

      expect(lobbyRes.status).toBe(400);
      expect(lobbyRes.body.error).toContain('already in another lobby');
    });
  });

  // ==================== ТЕСТЫ ОШИБОК СЕРВЕРА ====================
  describe('Server Error Tests', () => {
    it('should return 500 on database connection error', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 1 });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Internal server error'
      });
    });

    it('should return 500 on Prisma query error', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Prisma query error'));

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 1 });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });

    it('should return 500 on network error', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Network error'));

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: 1 });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  // ==================== ТЕСТЫ ГРАНИЧНЫХ СЛУЧАЕВ ====================
  describe('Edge Cases', () => {
    it('should handle numeric string ownerId', async () => {
      const mockUser = { id: 1, name: 'TestUser' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: '1' }); 

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should handle very large ownerId numbers', async () => {
      const largeId = 999999999;
      const mockUser = { id: largeId, name: 'TestUser' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/lobby/newlobby')
        .send({ ownerId: largeId });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

  });

});