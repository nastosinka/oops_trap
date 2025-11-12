const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../db/prismaClient');

const router = express.Router();

// ========================================
// POST /api/auth/login
// ========================================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Введите имя пользователя и пароль', code: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { name: username }, // заменили username → name
    });

    if (!user) {
      return res.status(401).json({ error: `Неверное имя пользователя или пароль [username] ${username} and ${password}`, code: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password); // заменили password_hash → password
    if (!isPasswordValid) {
      return res.status(401).json({ error: `Неверное имя пользователя или пароль [password] ${password} and ${user.password}`, code: 401 });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.name, // заменили user.username → user.name
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
    res.status(500).json({ error: 'Ошибка сервера при авторизации', code: 500 });
  }
});

module.exports = router;
