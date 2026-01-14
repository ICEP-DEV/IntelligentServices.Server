export default (io, socket) => {
  const adminJoin = (region) => {
    // Admins might join a region-specific room to see live updates
    socket.join(`admin_${region}`);
    console.log(`Admin ${socket.id} joined region ${region}`);
  };

  // Example: Admin broadcasting an alert
  socket.on("admin_join_region", adminJoin);
};