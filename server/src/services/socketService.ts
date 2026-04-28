import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log('A client connected:', socket.id);

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
