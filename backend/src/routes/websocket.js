const express = require("express");
const router = express.Router();
const { gameSessions } = require("../websockets/game"); // импорт из game.js

// Получение списка активных WebSocket-комнат
router.get("/ws/sessions", (req, res) => {
    res.json({
        sessions: Array.from(gameSessions.keys())
    });
});

// Получение информации о конкретной WebSocket-комнате
router.get("/ws/game/:id", (req, res) => {
    const gameId = parseInt(req.params.id, 10);

    if (!gameSessions.has(gameId)) {
        return res.status(404).json({
            ok: false,
            message: `Game session ${gameId} not found`
        });
    }

    // Возвращаем URL комнаты для WebSocket-клиента
    res.json({
        ok: true,
        gameId,
        wsUrl: `/ws/game/${gameId}`
    });
});

module.exports = router;
