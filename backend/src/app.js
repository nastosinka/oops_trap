const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>Server is running!</h1><p>Ping-pong WS доступен на /ws/game</p>');
});

module.exports = app;