import { io, Socket } from 'socket.io-client';
import { useUserStore } from '../store/userStore';

let socket: Socket | null = null;

export const getSocket = () => {
    const token = useUserStore.getState().token;
    if (!token) {
        return null;
    }

    if (!socket) {
        // Socket.io 必须用完整 URL
        // 线上环境请在 Vercel 的环境变量里配置 VITE_SOCKET_URL=https://你的后端域名
        // 本地开发时 fallback 到 vite proxy (localhost:5173) 走 ws 代理
        const socketUrl = import.meta.env.VITE_SOCKET_URL ||
            (import.meta.env.DEV
                ? window.location.origin
                : window.location.origin);

        socket = io(socketUrl, {
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
