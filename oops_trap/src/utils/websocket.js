import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

export function createGameSocket(lobbyId) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // const host = import.meta.env.VITE_SERVER_IP || window.location.host;
    const host = "localhost";
    console.log(`${protocol}//${host}/ws/game/${lobbyId}`);
    return new WebSocket(`${protocol}//${host}/ws/game/${lobbyId}`);
}
