const express = require('express');
const prisma = require('../db/prismaClient');

const router = express.Router();

const lobbies = new Map();
let nextLobbyId = 1;

router.post('/newlobby', async (req, res) => {
  try {
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    for (let [lobbyId, lobby] of lobbies.entries()) {
      if (lobby.players.some(player => player.id === ownerId)) {
        return res.status(400).json({ error: 'User already in another lobby' });
      }
    }

    const lobby = {
      id: nextLobbyId++,
      ownerId: ownerId,
      status: 'waiting', // waiting, in-progress, finished
      map: null,
      players: [user],
      createdAt: new Date(),
      trapper: null,
      time: 'normal', // easy, normall, hard
      startedAt: null
    };

    lobbies.set(lobby.id, lobby);

    res.status(201).json({id: lobby.id});
  } catch (error) {
    console.error('Error creating lobby:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/alllobbies', (req, res) => {
  const lobbyList = Array.from(lobbies.values()).map(lobby => ({
    id: lobby.id,
    owner: lobby.players[0].name,
    status: lobby.status,
    playerCount: lobby.players.length
  }));
  
  res.json({ lobbies: lobbyList, total: lobbies.size });
});


router.post('/lobbies/:id/delete', async (req, res) => {
  try {
    const lobbyId = parseInt(req.params.id);
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }

    const lobby = lobbies.get(lobbyId);
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.ownerId !== ownerId) {
      return res.status(403).json({ error: 'Only lobby owner can delete the lobby' });
    }

    lobbies.delete(lobbyId);
    
    console.log(`Лобби ${lobbyId} удалено пользователем ${ownerId}`);
    console.log('Осталось лобби:', lobbies.size);

    res.status(200).json({ 
      message: 'Lobby deleted successfully',
      deletedLobbyId: lobbyId
    });
  } catch (error) {
    console.error('Error deleting lobby:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/lobbies/:id/settings', async (req, res) => {
  try {
    const lobbyId = parseInt(req.params.id);
    const { ownerId, map, time, trapper } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }

    if (isNaN(lobbyId) || lobbyId <= 0) {
      return res.status(400).json({ error: 'Invalid lobby ID' });
    }


    const lobby = lobbies.get(lobbyId);
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.ownerId !== ownerId) {
      return res.status(403).json({ 
        error: 'Access denied. Only the lobby owner can change lobby settings' 
      });
    }

    if (lobby.status !== 'waiting') {
      return res.status(400).json({ 
        error: 'Cannot change settings. Lobby is not in waiting state' 
      });
    }

    const updates = {};
    const errors = [];
    const allMaps = await prisma.maps.findMany();
    const mapExists = allMaps.some(mapItem => mapItem.id === map);

    if (mapExists) {
        updates.map = map;
    } else {
        const validMapIds = allMaps.map(m => m.id);
        errors.push(`Invalid map ID: ${map}. Valid map IDs: ${validMapIds.join(', ')}`);
    }

    const validTimes = ['easy', 'normal', 'hard'];
    if (validTimes.includes(time)) {
        updates.time = time;
    } else {
        errors.push(`Invalid time: ${time}. Valid options: ${validTimes.join(', ')}`);
    }

    if (trapper === null) {
        updates.trapper = null;
    } else {
        const isPlayerInLobby = lobby.players.some(player => player.id === trapper);
        if (isPlayerInLobby) {
          updates.trapper = trapper;
        } else {
          errors.push(`Trapper (ID: ${trapper}) is not a player in this lobby`);
        }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }

    Object.assign(lobby, updates);
    
    console.log(`Настройки лобби ${lobbyId} обновлены:`, updates);
    console.log(`Новые настройки: map=${lobby.map}, time=${lobby.time}, trapper=${lobby.trapper}`);

    res.status(200).json({ 
      message: 'Lobby settings updated successfully',
      lobby: {
        id: lobby.id,
        ownerId: lobby.ownerId,
        status: lobby.status,
        map: lobby.map,
        time: lobby.time,
        trapper: lobby.trapper,
        players: lobby.players,
        playerCount: lobby.players.length
      }
    });
  } catch (error) {
    console.error('Error updating lobby settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/lobbies/:id/settings', async (req, res) => {
  try {
    const lobbyId = parseInt(req.params.id);

    if (isNaN(lobbyId) || lobbyId <= 0) {
      return res.status(400).json({ error: 'Invalid lobby ID' });
    }

    const lobby = lobbies.get(lobbyId);
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    const response = {
      id: lobby.id,
      ownerId: lobby.ownerId,
      status: lobby.status,
      map: lobby.map,
      time: lobby.time,
      trapper: lobby.trapper,
      players: lobby.players,
      playerCount: lobby.players.length,
      createdAt: lobby.createdAt
    };

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching lobby settings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});


router.post('/lobbies/:id/status', async (req, res) => {
  try {
    const lobbyId = parseInt(req.params.id);
    const { ownerId, newStatus } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }

    if (!newStatus) {
      return res.status(400).json({ error: 'newStatus is required' });
    }

    if (isNaN(lobbyId) || lobbyId <= 0) {
      return res.status(400).json({ error: 'Invalid lobby ID' });
    }

    const lobby = lobbies.get(lobbyId);
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    if (lobby.ownerId !== ownerId) {
      return res.status(403).json({ 
        error: 'Access denied. Only the lobby owner can change lobby status' 
      });
    }

    const validStatuses = ['waiting', 'in-progress', 'finished'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ 
        error: `Invalid status: ${newStatus}. Valid statuses: ${validStatuses.join(', ')}` 
      });
    }

    if (newStatus === 'in-progress') {
      const errors = [];

      if (lobby.players.length < 2) {
        errors.push('Cannot start game: at least 2 players required');
      }
      //дописать проверки

      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot change status to in-progress', 
          details: errors 
        });
      }
    }

    if (newStatus === 'finished' && lobby.status !== 'in-progress') {
      return res.status(400).json({ 
        error: 'Cannot finish lobby that is not in progress' 
      });
    }

    if (newStatus === 'waiting' && lobby.status !== 'finished') {
      return res.status(400).json({ 
        error: 'Cannot waiting lobby that is not finished' 
      });
    }

    const previousStatus = lobby.status;
    
    lobby.status = newStatus;

    console.log(` Статус лобби ${lobbyId} изменен: ${previousStatus} -> ${newStatus}`);
    
    if (newStatus === 'finished') {
      console.log(` Игра в лобби ${lobbyId} завершена`);
      // дописать статы
    }

    res.status(200).json({ 
      message: 'Lobby status updated successfully',
      lobby: {
        id: lobby.id,
        ownerId: lobby.ownerId,
        previousStatus: previousStatus,
        newStatus: lobby.status,
        map: lobby.map,
        time: lobby.time,
        trapper: lobby.trapper,
        players: lobby.players,
        playerCount: lobby.players.length
      }
    });
  } catch (error) {
    console.error('Error updating lobby status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
