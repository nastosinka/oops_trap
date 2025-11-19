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

/**
 * ===========================
 * POST /api/stats
 * ===========================
 * Создать или обновить статистику
 * Обновляет существующую запись, если найдена с тем же id_user, id_map и role
 */
router.post('/', async (req, res) => {
  try {
    const { id_user, id_map, time, role } = req.body;

    if (id_user === undefined || id_map === undefined || time === undefined || role === undefined) {
      return res.status(400).json({ 
        error: 'Обязательные поля: id_user, id_map, time, role',
        code: 400,
      });
    }

    const userId = parseInt(id_user);
    const mapId = parseInt(id_map);
    const timeValue = parseInt(time);

    if (isNaN(userId) || isNaN(mapId) || isNaN(timeValue)) {
      return res.status(400).json({ 
        error: 'Поля id_user, id_map и time должны быть числами',
        code: 400,
      });
    }

    let roleBoolean;
    if (!(typeof role === 'boolean')) {
        return res.status(400).json({ 
        error: 'Поле role должно быть булевым значением',
        code: 400,
      });
    }

    const existingStat = await prisma.stats.findFirst({
      where: {
        id_user: parseInt(id_user),
        id_map: parseInt(id_map),
        role: role,
      },
    });

    let result;
    let action;

    if (existingStat) {
      if (existingStat.time > parseInt(time)){
      result = await prisma.stats.update({
        where: {
          id: existingStat.id,
        },
        data: {
          time: parseInt(time),
        },
      });
      action = 'updated';
      console.log('Статистика обновлена:', result);
    }else{
      console.log('Статистика не требует обновлений');
      result = existingStat;
    }
    } else {
      result = await prisma.stats.create({
        data: {
          id_user: parseInt(id_user),
          id_map: parseInt(id_map),
          time: parseInt(time),
          role: role,
        },
      });
      action = 'created';
      console.log('Новая статистика создана:', result);
    }

    const formattedResult = {
      id: result.id,
      id_user: result.id_user,
      id_map: result.id_map,
      time: result.time,
      role: result.role,
    };

    res.status(200).json({
      success: true,
      action: action,
      data: formattedResult,
    });

  } catch (error) {
    console.error('Ошибка при сохранении статистики:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Неверный id_user или id_map',
        code: 400,
        details: 'Указанный пользователь или карта не существует'
      });
    }

    res.status(500).json({
      error: 'Ошибка сервера при сохранении статистики',
      code: 500,
      details: error.message
    });
  }
});

module.exports = router;