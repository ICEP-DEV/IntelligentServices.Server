export default (io, socket) => {
  const joinConversation = (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  };

  const leaveConversation = (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  };

  const typingIndicator = ({ conversationId, isTyping }) => {
    socket.to(conversationId).emit("user_typing", { userId: socket.data.userId, isTyping });
  };

  socket.on("join_conversation", joinConversation);
  socket.on("leave_conversation", leaveConversation);
  socket.on("typing", typingIndicator);
};