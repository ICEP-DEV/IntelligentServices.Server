import { Server } from 'socket.io';
import registerConversationHandlers from './handlers/conversationHandler.js';
import registerMessageHandlers from './handlers/messageHandler.js';
import registerAdminHandlers from './handlers/adminHandler.js';
import registerNotificationHandlers from './handlers/notificationHandler.js';

let io;

export const initSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Optional: Middleware for auth could go here
    // socket.data.userId = ...

    // Register Handlers
    registerConversationHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerAdminHandlers(io, socket);
    registerNotificationHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};