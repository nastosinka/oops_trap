const { setupGameWebSocket } = require("./game");

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

const { handleUpgrade } = require('./websockets/game');

server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/ws/game/')) {
        handleUpgrade(req, socket, head);
    } else {
        socket.destroy();
    }
});

function startWebSocketServer(server) {
  setupGameWebSocket(server);
  console.log("WS system initialized");
}

module.exports = { startWebSocketServer };