const { PING_INTERVAL } = require('../config/serverConfig')

function setupPingPong(ws) {
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'pong', data: { timestamp: Date.now() } }));
      console.log('Server sent: pong');
    }
  }, PING_INTERVAL);

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', data: { timestamp: Date.now() } }));
      console.log('Server received ping and sent pong');
    }
  });

  ws.on('close', () => clearInterval(interval));
}

module.exports = { setupPingPong };
