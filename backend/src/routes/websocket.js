const express = require("express");
const router = express.Router();
const { gameSessions } = require("../websockets/game"); // импорт из game.js

// Получение списка активных WebSocket-комнат
router.get("/ws/sessions", (req, res) => {
    res.json({
        sessions: Array.from(gameSessions.keys())
    });
});

module.exports = router;
