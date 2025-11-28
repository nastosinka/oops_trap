import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

export function createGameSocket(lobbyId) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // const host = import.meta.env.VITE_SERVER_IP || window.location.host;
    const host = "localhost";
    console.log(`${protocol}//${host}/ws/game/${lobbyId}`);
    return new WebSocket(`${protocol}//${host}/ws/game/${lobbyId}`);
}

export function closeGameSocket(gameSocket) {
    code = 1000;
    reason = "User left";
    if (gameSocket.value) {
        if (gameSocket.value.readyState === WebSocket.OPEN) {
            // Отправляем сообщение о выходе из игры перед закрытием
            try {
                gameSocket.value.send(
                    JSON.stringify({
                        type: "PLAYER_LEFT",
                        gameId: currentGameId.value,
                        userId: userId.value,
                        lobbyId: currentLobbyId.value,
                    })
                );
                console.log("🔌 Game socket closed");
            } catch (error) {
                console.warn("Could not send leave message:", error);
            }

            gameSocket.value.close(code, reason);
        }
        gameSocket.value = null;
    }

    userStore.clearGameState();

    currentGameId.value = null;
    currentLobbyId.value = null;
};


export function sendGameMessage(message, gameSocket) {
    if (!gameSocket.value || gameSocket.value.readyState !== WebSocket.OPEN) {
        console.error("Cannot send message: game socket not connected");
        return false;
    }

    try {
        const payload =
            typeof message === "string" ? message : JSON.stringify(message);
        gameSocket.value.send(payload);
        return true;
    } catch (error) {
        console.error("Error sending game message:", error);
        return false;
    }
};