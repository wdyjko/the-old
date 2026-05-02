import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: Server;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log('A client connected:', socket.id);

        const token = socket.handshake.auth?.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as { user?: { id: number } };
                if (decoded.user?.id) {
                    socket.join(`user_${decoded.user.id}`);
                }
            } catch (error) {
                console.warn('Socket auth token invalid');
            }
        }

        /**
         * Clients can join specific rooms based on their user ID or role
         * e.g., socket.join('volunteer_room') or socket.join(`user_${userId}`)
         */
        socket.on('join', (room: string) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
