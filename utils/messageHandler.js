import { getBotResponse } from "../utils/botService.js";

export default (io, socket) => {
  const sendMessage = async (data) => {
    const { conversationId, message, history } = data;
    
    // Broadcast message to the room (excluding sender if needed, or use io.to)
    io.to(conversationId).emit("receive_message", {
      senderId: socket.data.userId || "anonymous",
      text: message,
      timestamp: new Date(),
    });

    // Check if bot should reply (logic depends on your requirements)
    if (data.isBotConversation) {
      try {
        const botReply = await getBotResponse(history || [], message);
        io.to(conversationId).emit("receive_message", {
          senderId: "bot",
          text: botReply,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error("Bot handler error:", err);
      }
    }
  };

  socket.on("send_message", sendMessage);
};