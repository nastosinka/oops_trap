const WebSocket = require("ws");

const gameId = 1;

const ws = new WebSocket(`ws://localhost/ws/game/${gameId}`);

ws.on("open", () => {
  console.log("Connected to Game WebSocket");
});

ws.on("message", (msg) => {
  console.log("WS Message:", msg.toString());
});

ws.on("error", (err) => {
  console.log("WS Error:", err);
});

ws.on("close", () => {
  console.log("WS Disconnected");
});
