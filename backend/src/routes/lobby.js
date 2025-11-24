//ownerId подумать



const express = require('express');
const prisma = require('../db/prismaClient');
const { createGameSession} = require('../websockets/game');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const lobbies = new Map();
let nextLobbyId = 1;

const games = new Map();
module.exports = { lobbies, games };

router.post('/newlobby', requireAuth, async (req, res) => {
  try {
    //const { ownerId } = req.body;
    const ownerId = req.user.id;

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
      time: 'normal' // easy, normal, hard
    };

    lobbies.set(lobby.id, lobby);

    res.status(201).json({id: lobby.id});
  } catch (error) {
    console.error('Error creating lobby:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/all-lobbies', (req, res) => {
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

    const relatedGame = Array.from(games.values()).find(g => g.lobbyId === lobbyId);
    if (relatedGame) {
      games.delete(relatedGame.id);
      console.log(`Игра ${relatedGame.id} (из лобби ${lobbyId}) удалена`);
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

    const previousStatus = lobby.status;

    if (newStatus === 'in-progress' && previousStatus === "waiting") {
      const errors = [];

      if (lobby.players.length < 2) {
        errors.push('Cannot start game: at least 2 players required');
      }

      if (!lobby.trapper) {
        errors.push('Trapper is not assigned');
      }
      if (!lobby.map) {
        errors.push('Map is not selected');
      }
      if (!lobby.time) {
        errors.push('Time setting is not selected');
      }
      if (lobby.players.length > 5) {
        errors.push('Too many players (max 5 allowed)');
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot change status to in-progress', 
          details: errors 
        });
      }
      const game = {
        id: lobby.id,
        lobbyId: lobby.id,
        map: lobby.map,
        trapper: lobby.trapper,
        time: lobby.time,
        players: lobby.players,
        status: 'in-progress',
        stats: []
      };

      games.set(game.id, game);
      
      console.log(`Game ${game.id} started from lobby ${lobby.id}`);
      lobby.status = newStatus;
      console.log(`Status of lobby ${lobbyId} changed: ${previousStatus} -> ${newStatus}`);
      

      lobby.currentGameId = game.id;
      game.stats = await createGameSession(game);
      console.log('Game ended with stats:', game.stats);
      
try {
  const updatePromises = game.stats.map(async (stat) => {
    const statsData = {
      id_user: stat.userId,
      id_map: stat.map,
      time: stat.time,
      role: stat.role
    };

    console.log(`Отправляем статистику для пользователя ${stat.userId}:`, statsData);
    const response = await fetch('http://localhost:8080/api/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statsData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log(`Статистика обновлена для пользователя ${stat.userId}:`, result);
    return result;
  });

  const results = await Promise.all(updatePromises);
  console.log('Все статистики обработаны:', results.filter(result => result !== null));

  lobby.status = 'finished';
  console.log('Статус лобби изменен на "finished"');

} catch (error) {
  console.error('Ошибка при обновлении статистик:', error);
}


      lobby.status = 'finished';
    }

    if (newStatus === 'finished') {
      if (lobby.status !== 'in-progress') {
        return res.status(400).json({ 
          error: 'Cannot finish lobby that is not in progress' 
        });
      }
      
      if (lobby.currentGameId) {
        const game = games.get(lobby.currentGameId);
        if (game) {
          game.status = 'finished';
          console.log(`Game ${game.id} finished with lobby ${lobby.id}`);
        }
      }
      
      console.log(`Game in lobby ${lobbyId} completed`);
      lobby.status = newStatus;

    }

    if (newStatus === 'waiting') {
      if (lobby.status !== 'finished') {
        return res.status(400).json({ 
          error: 'Cannot set lobby to waiting that is not finished' 
        });
      }
      games.delete(lobby.currentGameId);
      lobby.currentGameId = null;
      console.log(`Lobby ${lobbyId} reset for new game`);
      lobby.status = newStatus;
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
        playerCount: lobby.players.length,
        currentGameId: lobby.currentGameId || null
      },
      ...(lobby.currentGameId && {
        game: {
          id: lobby.currentGameId,
          stats: games.get(lobby.currentGameId)?.stats || []
        }
      })
    });
  } catch (error) {
    console.error('Error updating lobby status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/lobbies/:id/join', async (req, res) => {
  try {
    const lobbyId = parseInt(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (isNaN(lobbyId) || lobbyId <= 0) {
      return res.status(400).json({ error: 'Invalid lobby ID' });
    }

    const lobby = lobbies.get(lobbyId);
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    if (lobby.status !== 'waiting') {
      return res.status(400).json({ error: 'Cannot join lobby - game already started' });
    }

    for (let [existingLobbyId, existingLobby] of lobbies.entries()) {
      if (existingLobbyId !== lobbyId && existingLobby.players.some(player => player.id === userId)) {
        return res.status(400).json({ error: 'User already in another lobby' });
      }
    }

    if (lobby.players.some(player => player.id === userId)) {
      return res.status(400).json({ error: 'User already in this lobby' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    lobby.players.push(user);

    console.log(`Пользователь ${user.name} (ID: ${userId}) присоединился к лобби ${lobbyId}`);
    console.log(`Теперь в лобби ${lobby.players.length} игроков`);

    res.status(200).json({ 
      message: 'User joined lobby successfully',
      lobby: {
        id: lobby.id,
        status: lobby.status,
        players: lobby.players,
        playerCount: lobby.players.length
      }
    });
  } catch (error) {
    console.error('Error joining lobby:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/lobbies/:id/leave', async (req, res) => {
  try {
    const lobbyId = parseInt(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (isNaN(lobbyId) || lobbyId <= 0) {
      return res.status(400).json({ error: 'Invalid lobby ID' });
    }

    const lobby = lobbies.get(lobbyId);
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    const playerIndex = lobby.players.findIndex(player => player.id === userId);
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'User not found in this lobby' });
    }

    const removedPlayer = lobby.players[playerIndex];

    lobby.players.splice(playerIndex, 1);

    if (lobby.trapper === userId) {
      lobby.trapper = null;
    }

    let lobbyDeleted = false;

    if (lobby.players.length === 0) {
      lobbies.delete(lobbyId);
      lobbyDeleted = true;
      console.log(`Лобби ${lobbyId} удалено, так как все игроки вышли`);
    }
    else if (lobby.ownerId === userId) {
      lobby.ownerId = lobby.players[0].id;
      console.log(`Новый владелец лобби ${lobbyId}: ${lobby.players[0].name} (ID: ${lobby.players[0].id})`);
    }

    console.log(`Пользователь ${removedPlayer.name} (ID: ${userId}) покинул лобби ${lobbyId}`);
    console.log(`В лобби осталось ${lobby.players.length} игроков`);

    if (lobbyDeleted) {
      res.status(200).json({ 
        message: 'User left lobby and lobby was deleted',
        lobbyDeleted: true,
        deletedLobbyId: lobbyId
      });
    } else {
      res.status(200).json({ 
        message: 'User left lobby successfully',
        lobbyDeleted: false,
        lobby: {
          id: lobby.id,
          ownerId: lobby.ownerId,
          status: lobby.status,
          players: lobby.players,
          playerCount: lobby.players.length,
          trapper: lobby.trapper
        }
      });
    }
  } catch (error) {
    console.error('Error leaving lobby:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================
// GET /api/lobby/lobbies/:id/users - получить список всех игроков из лобби
router.get('/lobbies/:id/users', async (req, res) => {
  try {
    const lobbyId = parseInt(req.params.id);

    if (isNaN(lobbyId) || lobbyId <= 0) {
      return res.status(400).json({ error: 'Invalid lobby ID' });
    }

    const lobby = lobbies.get(lobbyId);
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }

    res.status(200).json({
      lobbyId: lobby.id,
      playerCount: lobby.players.length,
      players: lobby.players
    });
  } catch (error) {
    console.error('Error fetching lobby users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================
// GET /api/lobby/games - получить список всех активных игр (созданных из лобби)
router.get('/games', (req, res) => {
  try {
    if (games.size === 0) {
      return res.status(200).json({ message: 'No active games', games: [] });
    }

    const activeGames = Array.from(games.values()).map(game => ({
      id: game.id,
      lobbyId: game.lobbyId,
      map: game.map,
      trapper: game.trapper,
      time: game.time,
      playerCount: game.players.length,
      players: game.players,
      status: game.status
    }));

    res.status(200).json({
      total: activeGames.length,
      games: activeGames
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/lobbies/:id/status', async (req, res) => {
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
      status: lobby.status
    };

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching lobby status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;