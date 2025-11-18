const express = require('express');
const prisma = require('../db/prismaClient');

const router = express.Router();

/**
 * ===========================
 * GET /api/maps
 * ===========================
 * Получить список всех карт
 */
router.get('/', async (req, res) => {
  try {
    const maps = await prisma.maps.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        hp: true,
        max_players: true,
        picture_url: true,
      },
    });

    if (!maps || maps.length === 0) {
      return res.status(404).json({
        error: 'Карты не найдены',
        code: 404,
      });
    }

    res.status(200).json(maps);
  } catch (err) {
    console.error('Ошибка при получении списка карт:', err);
    res.status(500).json({
      error: 'Ошибка сервера при получении списка карт',
      code: 500,
    });
  }
});

module.exports = router;
