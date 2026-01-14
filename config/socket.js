import { Server } from "socket.io";
import { Op, fn, col } from "sequelize";
import Feedback from "../model/feedback.js";
import { Message, Conversation } from "../model/message.js";
import UserConversation from "../model/CitizenConversation.js";
import AdminConversation from "../model/AdminConversation.js";
import { getGeminiResponse, BOT_USER_ID } from "./Gemini.js";

let io;

export const initSocket = (server, corsOptions) => {
  io = new Server(server, { cors: corsOptions });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    // ================= Notifications / Rooms =================
    socket.on("subscribeToNotifications", (room) => {
      socket.join(room);
      console.log(`${socket.id} joined room: ${room}`);
    });

    socket.on("RegisteredRole", async ({ userId, role, region }) => {
      socket.userId = userId;
      socket.role = role;
      socket.region = region;
      socket.join(`user:${userId}`);
      console.log(`User ${userId} registered with role ${role}`);
      if (role === "admin") {
        socket.join("feedback-hub");
        const feedbacks = await Feedback.findAll({
          order: [["createdAt", "DESC"]],
        });
        socket.emit("loadFeedbackHub", feedbacks);
      }
    });
    // ================= Conversations =================
    socket.on("startConversation", async ({ users }) => {
      if (!socket.userId) return socket.emit("authError", { message: "Not authorized." });

      let participants = [...new Set([...users, socket.userId])].filter(u => u !== BOT_USER_ID);

      // Add bot to citizen conversations
      if (socket.role === "citizen") {
        participants.push(BOT_USER_ID);
      }

      const conversation = await Conversation.create();

      // Create entries in the correct join tables
      const citizenParticipants = participants.filter(p => p !== BOT_USER_ID);
      await UserConversation.bulkCreate(
        citizenParticipants.map(citizen_id => ({ citizen_id, conversation_id: conversation.conversation_id }))
      );

      if (socket.role === "citizen") {
        await AdminConversation.create({ admin_id: BOT_USER_ID, conversation_id: conversation.conversation_id });
      }

      participants.forEach((u) => {
        io.to(`user:${u}`).emit("conversationStarted", conversation);
      });
    });

    socket.on("getPrivateConversation", async ({ citizenId, adminId }) => {
      if (!socket.userId) return socket.emit("authError", { message: "Not authorized." });

      // Security Check: Ensure the requester is one of the participants
      if (socket.userId !== citizenId && socket.userId !== adminId) {
        return socket.emit("authError", { message: "You are not authorized to view this conversation." });
      }

      try {
        // 1. Look for an existing conversation involving exactly this citizen and this admin
        const existingConvo = await Conversation.findOne({
          include: [
            {
              model: UserConversation,
              where: { citizen_id: citizenId },
              required: true
            },
            {
              model: AdminConversation,
              where: { admin_id: adminId },
              required: true
            }
          ]
        });

        let conversation;

        if (existingConvo) {
          // 2. Double check to ensure no other participants exist (Strictly 1:1)
          const userCount = await UserConversation.count({ where: { conversation_id: existingConvo.conversation_id } });
          const adminCount = await AdminConversation.count({ where: { conversation_id: existingConvo.conversation_id } });

          if (userCount === 1 && adminCount === 1) {
            conversation = existingConvo;
          }
        }

        if (conversation) {
          socket.emit("conversationStarted", conversation);
        } else {
          // 3. If no 1:1 conversation exists, create a new one
          const newConvo = await Conversation.create();

          // Create entry in the Citizen junction table
          await UserConversation.create({
            citizen_id: citizenId,
            conversation_id: newConvo.conversation_id,
          });

          // Create entry in the Admin junction table
          await AdminConversation.create({
            admin_id: adminId,
            conversation_id: newConvo.conversation_id,
          });

          // Notify both parties
          io.to(`user:${citizenId}`).emit("conversationStarted", newConvo);
          io.to(`user:${adminId}`).emit("conversationStarted", newConvo);
        }
      } catch (error) {
        console.error("Error fetching/creating conversation:", error);
        socket.emit("error", { message: "Internal server error" });
      }
    });

    // ================= Messages =================
    socket.on("loadHistory", async ({ conversationId }) => {
      if (!socket.userId) return socket.emit("authError", { message: "Not authorized." });

      const participant = await UserConversation.findOne({
        where: { conversation_id: conversationId, citizen_id: socket.userId },
      }) || await AdminConversation.findOne({
        where: { conversation_id: conversationId, admin_id: socket.userId },
      });

      if (!participant) return socket.emit("authError", { message: "Access denied." });

      const messages = await Message.findAll({
        where: { conversation_id: conversationId },
        order: [["createdAt", "ASC"]],
      });

      socket.emit("conversationHistory", messages);
    });

    socket.on("sendMessage", async ({ conversationId, text, imageUrl }) => {
      if (!socket.userId) return socket.emit("authError", { message: "Not authorized." });
      if (!conversationId) return socket.emit("authError", { message: "Conversation not established." });
      if (!text && !imageUrl) return socket.emit("authError", { message: "Cannot send an empty message." });
      const message = await Message.create({
        conversation_id: conversationId,
        senderId: socket.userId,
        text,
        image_url: imageUrl, // Save the image URL
      });

      // Notify participants
      const citizenParticipants = await UserConversation.findAll({
        where: { conversation_id: conversationId },
      });
      const adminParticipants = await AdminConversation.findAll({
        where: { conversation_id: conversationId },
      });

      citizenParticipants.forEach((p) => {
        io.to(`user:${p.citizen_id}`).emit("newMessage", message);
      });
      adminParticipants.forEach((p) => {
        io.to(`user:${p.admin_id}`).emit("newMessage", message);
      });

      // Bot responds to citizen messages
      if (socket.role === "citizen") {
        const dbHistory = await Message.findAll({
          where: { conversation_id: conversationId },
          order: [["createdAt", "DESC"]],
          limit: 20,
        });

        const geminiHistory = dbHistory
          .reverse()
          .map((msg) => ({
            role: msg.senderId === BOT_USER_ID ? "model" : "user",
            parts: [{ text: msg.text }],
          }));
        const botResponseText = await getGeminiResponse(geminiHistory, socket.role, socket.userId, socket.region);
        if (botResponseText === '__HUMAN_INTERVENTION__') {
          const humanInterventionMessage = await Message.create({
            conversation_id: conversationId,
            senderId: BOT_USER_ID,
            text: "To speak with a consultant, please click the 'Connect to a consultant' icon (the person in a tie) at the top right of the chat window.",
          });

          // Only send this specific instruction to the user who asked
          io.to(`user:${socket.userId}`).emit("newMessage", humanInterventionMessage);
          adminParticipants.forEach((p) => {
            io.to(`user:${p.admin_id}`).emit("newMessage", humanInterventionMessage);
          });

          // Notify admins
          admins.forEach((admin) => {
            io.to(`user:${admin.admin_id}`).emit("humanInterventionRequest", {
              conversationId,
              citizenId: socket.userId,
              message: "A citizen has requested human assistance."
            });
          });
        } else {
          const botMessage = await Message.create({
            conversation_id: conversationId,
            senderId: BOT_USER_ID,
            text: botResponseText,
          });

          citizenParticipants.forEach((p) => {
            io.to(`user:${p.citizen_id}`).emit("newMessage", botMessage);
          });
          adminParticipants.forEach((p) => {
            io.to(`user:${p.admin_id}`).emit("newMessage", botMessage);
          });
        }
      }
    });

    // ================= Typing / Seen =================
    socket.on("markConversationAsRead", async ({ conversationId }) => {
      if (!socket.userId) return;

      await Message.update(
        { seen: true },
        {
          where: {
            conversation_id: conversationId,
            senderId: { [Op.ne]: socket.userId },
            seen: false,
          },
        },
      );

      const citizenParticipants = await UserConversation.findAll({
        where: { conversation_id: conversationId },
      });
      const adminParticipants = await AdminConversation.findAll({
        where: { conversation_id: conversationId },
      });

      citizenParticipants.forEach((p) => {
        if (p.citizen_id !== socket.userId) {
          io.to(`user:${p.citizen_id}`).emit("messagesSeen", {
            conversationId,
            userId: socket.userId,
          });
        }
      });
      adminParticipants.forEach((p) => {
        if (p.admin_id !== socket.userId) {
          io.to(`user:${p.admin_id}`).emit("messagesSeen", {
            conversationId,
            userId: socket.userId,
          });
        }
      });
    });

    socket.on("typingStarted", async ({ conversationId }) => {
      if (!socket.userId) return;

      const citizenParticipants = await UserConversation.findAll({
        where: { conversation_id: conversationId },
      });
      const adminParticipants = await AdminConversation.findAll({
        where: { conversation_id: conversationId },
      });

      citizenParticipants.forEach((p) => {
        if (p.citizen_id !== socket.userId) {
          io.to(`user:${p.citizen_id}`).emit("userTyping", {
            conversationId,
            userId: socket.userId,
          });
        }
      });
      adminParticipants.forEach((p) => {
        if (p.admin_id !== socket.userId) {
          io.to(`user:${p.admin_id}`).emit("userTyping", {
            conversationId,
            userId: socket.userId,
          });
        }
      });
    });

    socket.on("typingStopped", async ({ conversationId }) => {
      if (!socket.userId) return;

      const citizenParticipants = await UserConversation.findAll({
        where: { conversation_id: conversationId },
      });
      const adminParticipants = await AdminConversation.findAll({
        where: { conversation_id: conversationId },
      });

      citizenParticipants.forEach((p) => {
        if (p.citizen_id !== socket.userId) {
          io.to(`user:${p.citizen_id}`).emit("userStoppedTyping", {
            conversationId,
            userId: socket.userId,
          });
        }
      });
      adminParticipants.forEach((p) => {
        if (p.admin_id !== socket.userId) {
          io.to(`user:${p.admin_id}`).emit("userStoppedTyping", {
            conversationId,
            userId: socket.userId,
          });
        }
      });
    });

    socket.on("acceptHumanIntervention", async ({ conversationId, citizenId }) => {
      if (!socket.userId || socket.role !== "admin") return socket.emit("authError", { message: "Not authorized." });

      // Add admin to the conversation
      await AdminConversation.findOrCreate({
        where: { admin_id: socket.userId, conversation_id: conversationId },
        defaults: {
        admin_id: socket.userId,
        conversation_id: conversationId,
        }
      });
      io.to(`user:${citizenId}`).emit("adminJoinedConversation", {
        conversationId,
        adminId: socket.userId,
        message: "An administrator has joined the conversation."
      });

      // Send a welcome message from admin
      const welcomeMessage = await Message.create({
        conversation_id: conversationId,
        senderId: socket.userId,
        text: "Hello! I'm here to help you with your query. How can I assist you today?",
      });

      io.to(`user:${citizenId}`).emit("newMessage", welcomeMessage);
      io.to(`user:${socket.userId}`).emit("newMessage", welcomeMessage);
    });

    socket.on("requestHumanIntervention", async ({ conversationId }) => {
      if (!socket.userId || !conversationId) return;

      console.log(`User ${socket.userId} is requesting human intervention for conversation ${conversationId}`);

      // Find all online admins in the user's region
      const allSockets = await io.fetchSockets();
      const onlineAdminsInRegion = allSockets.filter(s => s.role === 'admin' && s.region === socket.region);

      if (onlineAdminsInRegion.length === 0) {
        const noAdminsMsg = await Message.create({ conversation_id: conversationId, senderId: BOT_USER_ID, text: "I'm sorry, but there are no administrators currently available in your region. Please try again later." });
        return io.to(`user:${socket.userId}`).emit("newMessage", noAdminsMsg);
      }
      onlineAdminsInRegion.forEach((adminSocket) => {
        io.to(adminSocket.id).emit("humanInterventionRequest", {
          conversationId,
          citizenId: socket.userId,
          message: `A citizen from region '${socket.region}' has requested assistance.`
        });
      });
      const confirmationMsg = await Message.create({ conversation_id: conversationId, senderId: BOT_USER_ID, text: "Your request has been sent to all available online administrators in your region. Someone will join shortly." });
      io.to(`user:${socket.userId}`).emit("newMessage", confirmationMsg);
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
