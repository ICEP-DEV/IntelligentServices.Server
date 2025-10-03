import { Server } from "socket.io";

let io;

export const initSocket = (server, corsOptions) => {
  io = new Server(server, { cors: corsOptions });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a room for notifications
    socket.on("subscribeToNotifications", (room) => {
      socket.join(room);
      console.log(`${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};


export const getSocket = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};