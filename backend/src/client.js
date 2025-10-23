const WebSocket = require('ws');
const { PING_INTERVAL } = require('./config/serverConfig')

const ws = new WebSocket('ws://localhost:8080/ws/game');

ws.on('open', () => {
  console.log('Connected to WebSocket!');

  sendPing();

  setInterval(sendPing, PING_INTERVAL);
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg);
  if (data.type === 'pong') {
    console.log('Received pong from server:', new Date(data.data.timestamp).toLocaleTimeString());
  } else {
    console.log('Received:', data);
  }
});

function sendPing() {
  if (ws.readyState === ws.OPEN) {
    const timestamp = Date.now();
    ws.send(JSON.stringify({ type: 'ping', data: { timestamp } }));
    console.log('Sent ping:', new Date(timestamp).toLocaleTimeString());
  }
}
