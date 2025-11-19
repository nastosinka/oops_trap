// Подключение к конкретной игре
const gameId = 1;
const socket = new WebSocket(`ws://localhost/ws/game/${gameId}`);

socket.onopen = () => {
    // Инициализация игрока
    socket.send(JSON.stringify({
        type: 'init',
        playerId: 1 // ID игрока
    }));
    console.log('Game messa');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Game message:', data);
    
    switch(data.type) {
        case 'waiting-start':
            console.log('Waiting for game to start...');
            break;
        case 'game-start':
            console.log('Game started!');
            break;
        case 'game-end':
            console.log('Game finished:', data.stats);
            break;
        case 'player-disconnected':
            console.log('Player disconnected:', data.playerId);
            break;
    }
};