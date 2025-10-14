import { Server } from "socket.io";

let io;

export const initSocket = (server, corsOptions) => {
  io = new Server(server, { cors: corsOptions });

  io.on("connection", (socket) => {
    socket.on("subscribeToNotifications", (room) => {
      socket.join(room);
      console.log(`${socket.id} joined room: ${room}`);
    });

    socket.on("RegisteredRole", ({userId, role, isSuperAdmin}) =>{
      if(role === "admin"){
        if(!isSuperAdmin) socket.join("admins");
        socket.join(`admin:${userId}`)
      }else if(role === "citizen"){
        socket.join(`citizen:${userId}`)
      }
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

  return io;
  });
}

export const getSocket = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};


