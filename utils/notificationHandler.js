export default (io, socket) => {
  const subscribeToNotifications = (userId) => {
    socket.join(`notifications_${userId}`);
    console.log(`User ${userId} subscribed to notifications`);
  };

  // Listen for client subscription
  socket.on("subscribe_notifications", subscribeToNotifications);
};