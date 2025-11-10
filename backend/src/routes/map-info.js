const express = require('express');
const prisma = require('../db/prismaClient');

const router = express.Router();
/**
 * ===========================
 * GET /api/maps/:id_map
 * ===========================
 * Получить информацию по конкретной карте
 */
router.get('/:id_map', async (req, res) => {
  const { id_map } = req.params;

  try {
    const map = await prisma.maps.findUnique({
      where: { id: parseInt(id_map) },
      select: {
        id: true,
        name: true,
        description: true,
        hp: true,
        max_players: true,
        picture_url: true,
      },
    });

    if (!map) {
      return res.status(404).json({ error: 'Карта не найдена', code: 404 });
    }

    res.status(200).json(map);
  } catch (err) {
    console.error('Ошибка при получении карты:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении карты', code: 500 });
  }
});

module.exports = router;
