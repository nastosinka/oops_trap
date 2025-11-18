const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../db/prismaClient');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// ========================================
// GET /api/auth/users - Получить всех пользователей
// ========================================
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        // Исключаем пароль из ответа!
      },
    });

    res.status(200).json({
      users,
      total: users.length,
    });
  } catch (err) {
    console.error('Ошибка при получении пользователей:', err);
    res.status(500).json({ 
      error: 'Ошибка сервера при получении пользователей', 
      code: 500 
    });
  }
});

// ========================================
// POST /api/auth/register
// ========================================
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Валидация входных данных
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Введите имя пользователя и пароль', 
        code: 400 
      });
    }

    // Проверка минимальной длины пароля
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Пароль должен содержать минимум 6 символов', 
        code: 400 
      });
    }

    // Проверка, что пользователь уже существует
    const existingUser = await prisma.user.findUnique({
      where: { name: username },
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Пользователь с таким именем уже существует', 
        code: 409 
      });
    }

    // Хеширование пароля
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создание пользователя
    const newUser = await prisma.user.create({
      data: {
        name: username,
        password: hashedPassword,
      },
    });


    // Генерация JWT токена
    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Успешный ответ
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: newUser.id,
        username: newUser.name,
      },
    });

  } catch (err) {
    console.error('Ошибка при регистрации:', err);
    
    // Обработка ошибок Prisma
    if (err.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Пользователь с таким именем уже существует', 
        code: 409 
      });
    }

    res.status(500).json({ 
      error: 'Ошибка сервера при регистрации', 
      code: 500 
    });
  }
});

// ========================================
// POST /api/auth/login
// ========================================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Введите имя пользователя и пароль', 
        code: 400 
      });
    }

    const user = await prisma.user.findUnique({
      where: { name: username },
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Неверное имя пользователя или пароль', 
        code: 401 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Неверное имя пользователя или пароль', 
        code: 401 
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.name,
        role: user.role || 'user',
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.name,
        role: user.role || 'user',
      },
    });
  } catch (err) {
    console.error('Ошибка при авторизации:', err);
    res.status(500).json({ 
      error: 'Ошибка сервера при авторизации', 
      code: 500 
    });
  }
});

module.exports = router;
