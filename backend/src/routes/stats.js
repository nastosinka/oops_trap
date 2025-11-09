const express = require('express');
const prisma = require('../db/prismaClient');

const router = express.Router();

/**
 * ===========================
 * GET /api/stats/:id_user
 * ===========================
 * Получить статистику игрока по всем картам
 */
router.get('/:id_user', async (req, res) => {
  const { id_user } = req.params;

  try {
    // TODO: добавить cookieAuth позже (пример)
    // const user = await verifyUser(req.cookies);
    // if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const stats = await prisma.stats.findMany({
      where: { id_user: parseInt(id_user) },
      select: {
        id_map: true,
        time: true,
        role: true
      },
    });

    if (!stats || stats.length === 0) {
      return res.status(404).json({
        error: 'Статистика для данного пользователя не найдена',
        code: 404,
      });
    }

    const formattedUserStats = stats.map(stat => ({
      map_id: stat.id_map,
      best_time: stat.time,
      role: stat.role ? 'runner' : 'trapper',
    }));

    res.status(200).json(formattedUserStats);
  } catch (err) {
    console.error('Ошибка при получении статистики:', err);
    res.status(500).json({
      error: 'Ошибка сервера при получении статистики',
      code: 500,
      desc: err
    });
  }
});


/**
 * ===========================
 * GET /api/stats/map/:id_map
 * ===========================
 * Получить статистику игрока по конкретной карте
 */
router.get('/map/:id_map', async (req, res) => {
  const { id_map } = req.params;

  try {
    // TODO: добавить cookieAuth позже
    // const user = await verifyUser(req.cookies);
    // if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const stats = await prisma.stats.findMany({
      where: { id_map: parseInt(id_map) },
      select: {
        id_map: true,
        time: true,
        role: true,
      },
    });

    if (!stats || stats.length === 0) {
      return res.status(404).json({
        error: 'Статистика для данного лобби не найдена',
        code: 404,
      });
    }

    const formattedMapStats = stats.map(stat => ({
      map_id: stat.id_map,
      best_time: stat.time,
      role: stat.role ? 'runner' : 'trapper',
    }));

    res.status(200).json(formattedMapStats);
  } catch (err) {
    console.error('Ошибка при получении статистики лобби:', err);
    res.status(500).json({
      error: 'Ошибка сервера при получении статистики лобби',
      code: 500,
    });
  }
});

module.exports = router;
