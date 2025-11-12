require('dotenv').config();
const WebSocket = require('ws');
//выводиттся в консоли такое сообщение:  User 2 joined WebSocket game 1
const gameId = 1;
const userId = 2; 
const token = process.env.JWT_TOKEN;

const ws = new WebSocket(`ws://localhost/ws/game`, token);

ws.on('open', () => {
  console.log('Connected to Game WebSocket');

  ws.send(JSON.stringify({ type: 'join', gameId, userId }));
  console.log("abobus");
});

ws.on('message', (msg) => {
  console.log('WS connection opened');
  try {
    const data = JSON.parse(msg);
    console.log("123132");
    switch (data.type) {
    case 'GAME_READY':
      console.log('Игра готова, переходим во фронтенд:', data.payload);
      // здесь фронтенд может автоматически открыть игровую сцену
      break;
    case 'GAME_START':
      console.log('Игра началась:', data.payload);
      break;

    case 'TICK':
      console.log('Осталось времени:', data.payload.timeLeft);
      break;

    case 'GAME_END':
      console.log('Игра окончена! Статистика:', data.payload.stats);
      break;

    case 'event':
      console.log('Событие от игрока:', data.event);
      break;
  }
  } catch (err) {
    console.error('WS Message parse error:', err);
  }
});

ws.on('close', () => {
  console.log('WS Disconnected');
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
});
