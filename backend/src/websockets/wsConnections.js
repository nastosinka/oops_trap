const wsConnections = new Map(); // key: userId, value: ws

function addConnection(userId, ws) {
  wsConnections.set(userId, ws);
}

function removeConnection(userId) {
  wsConnections.delete(userId);
}

function getConnection(userId) {
  return wsConnections.get(userId);
}

module.exports = { addConnection, removeConnection, getConnection };
