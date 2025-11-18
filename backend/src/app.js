const express = require('express');
const authRouter = require('./routes/auth');
const statsRouter = require('./routes/stats');
const mapListRouter = require('./routes/map-list');
const lobbyRouter = require('./routes/lobby');
const userRouter = require('./routes/user');
const websocketRouter = require("./routes/websocket");
const mapListRoutes = require('./routes/map-list');
const app = express();

app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);
app.use('/api/maps', mapListRouter);
app.use('/api/lobby', lobbyRouter);
app.use('/api/user', userRouter);
app.use("/api", websocketRouter);
app.use('/api/maps', mapListRoutes);


app.get('/', (req, res) => {
  res.send('<h1>Server is running!</h1><p>Ping-pong WS доступен на /ws/game</p>');
});

module.exports = app;