const { setupGameWebSocket } = require("./game");

function startWebSocketServer(server) {
  setupGameWebSocket(server);
  console.log("WS system initialized");
}

module.exports = { startWebSocketServer };
