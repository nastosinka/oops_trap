const express = require('express');
const statsRouter = require('./routes/stats');
const lobbyRouter = require('./routes/lobby');
const app = express();

app.use(express.json());
app.use('/api/stats', statsRouter);
app.use('/api/lobby', lobbyRouter);

app.get('/', (req, res) => {
  res.send('<h1>Server is running!</h1><p>Ping-pong WS доступен на /ws/game</p>');
});

module.exports = app;