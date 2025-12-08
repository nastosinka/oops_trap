const express = require('express');
const authRouter = require('./routes/auth');
const statsRouter = require('./routes/stats');
const mapsRouter = require('./routes/maps');
const lobbyRouter = require('./routes/lobby');
const userRouter = require('./routes/user');
const websocketRouter = require("./routes/websocket");
const cookieParser = require("cookie-parser");
const polygonsRouter = require("./routes/polygons");
const app = express();

app.use(cookieParser());

app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/lobby', lobbyRouter);
app.use('/api/user', userRouter);
app.use("/api", websocketRouter);
app.use("/api/polygons", polygonsRouter);


app.get('/', (req, res) => {
  res.send('<h1>Server is running!</h1><p>Ping-pong WS доступен на /ws/game</p>');
});

module.exports = app;