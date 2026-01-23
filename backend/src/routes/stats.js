const express = require('express');
const prisma = require('../db/prismaClient');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * ===========================
 * GET /api/stats/:id_user
 * ===========================
 * Получить статистику игрока по всем картам
 */
router.get('/:id_user', requireAuth, async (req, res) => {
  const id_user = req.user.id;

  try {
    const stats = await prisma.stats.findMany({
      where: { id_user: parseInt(id_user) },
      select: {
        id_map: true,
        time: true,
        role: true
      },
    });


    const formattedUserStats = stats.map(stat => ({
      map_id: stat.id_map,
      best_time: stat.time,
      role: stat.role ? 'runner' : 'trapper',
    }));

    res.status(200).json(formattedUserStats);
  } catch (err) {
    console.error('Ошибка при получении статистики:');
    res.status(500).json({
      error: 'Ошибка сервера при получении статистики',
      code: 500,
      desc: err
    });
  }
});
module.exports = router;
