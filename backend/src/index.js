const http = require('http');
const app = require('./app');
const { startWebSocketServer } = require('./websockets/index');
const { PORT } = require('./config/serverConfig')

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

startWebSocketServer(server);