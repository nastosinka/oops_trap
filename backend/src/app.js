const express = require('express');
const statsRouter = require('./routes/stats');
const mapInfoRouter = require('./routes/map-info');
const app = express();

app.use(express.json());
app.use('/api/stats', statsRouter);
app.use('/api/maps', mapInfoRouter);

app.get('/', (req, res) => {
  res.send('<h1>Server is running!</h1><p>Ping-pong WS доступен на /ws/game</p>');
});

module.exports = app;