import { io, Socket } from 'socket.io-client';
import { useUserStore } from '../store/userStore';

let socket: Socket | null = null;

export const getSocket = () => {
    const token = useUserStore.getState().token;
    if (!token) {
        return null;
    }

    if (!socket) {
        socket = io('http://localhost:5000', {
            transports: ['websocket'],
            auth: { token },
        });
    }

    if (!socket.connected) {
        socket.auth = { token };
        socket.connect();
    }

    return socket;
};
