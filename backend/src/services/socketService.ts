import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { env } from '../config/env';

const connectedUsers = new Map<string, string>();

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.socketOrigins,
      credentials: true,
    },
  });

  io.use((socket: any, next: any) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyAccessToken(token);
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.userId;
    const userRole = socket.data.user.role;

    console.log(`User connected: ${userId} (${userRole})`);

    connectedUsers.set(userId, socket.id);
    socket.join(userRole);

    socket.on('driverLocationUpdate', (data: any) => {
      if (userRole === 'driver') {
        io.to('admin').emit('driverLocationUpdate', {
          driverId: userId,
          ...data,
          timestamp: new Date(),
        });
      }
    });

    socket.on('crashDetected', (data: any) => {
      io.to('admin').emit('crashDetected', {
        driverId: userId,
        ...data,
        timestamp: new Date(),
      });
    });

    socket.on('safetyScoreUpdate', (data: any) => {
      if (userRole === 'driver') {
        io.to('admin').emit('safetyScoreUpdate', {
          driverId: userId,
          ...data,
          timestamp: new Date(),
        });
      }
    });

    socket.on('tripStarted', (data: any) => {
      if (userRole === 'driver') {
        io.to('admin').emit('tripStarted', {
          driverId: userId,
          ...data,
          timestamp: new Date(),
        });
      }
    });

    socket.on('tripEnded', (data: any) => {
      if (userRole === 'driver') {
        io.to('admin').emit('tripEnded', {
          driverId: userId,
          ...data,
          timestamp: new Date(),
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      connectedUsers.delete(userId);
    });
  });

  console.log('Socket.io initialized');

  return io;
};

export const getConnectedUsersCount = (): number => {
  return connectedUsers.size;
};

export const isUserConnected = (userId: string): boolean => {
  return connectedUsers.has(userId);
};
