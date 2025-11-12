require('dotenv').config();
const http = require('http');
const app = require('./app');
const { setupGameWebSocket } = require('./websockets/game');
const { PORT } = require('./config/serverConfig');

const server = http.createServer(app);

setupGameWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});