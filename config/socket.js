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

      // Admins join feedback hub
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

    socket.on("getPrivateConversation", async ({ recipientId }) => {
      if (!socket.userId) return socket.emit("authError", { message: "Not authorized." });

      // Find conversations where both citizens are participants
      const userConvos = await UserConversation.findAll({
          where: { citizen_id: [socket.userId, recipientId] },
          attributes: ['conversation_id', [fn('COUNT', col('conversation_id')), 'count']],
          group: ['conversation_id'],
          having: { count: 2 }
      })

      let existingConvo = null;
      for (let convo of userConvos) {
        if (convo.get("count") >= 2) {
          const totalCitizenParticipants = await UserConversation.count({
            where: { conversation_id: convo.conversation_id },
          });
          const totalAdminParticipants = await AdminConversation.count({
            where: { conversation_id: convo.conversation_id },
          });
          if (totalCitizenParticipants === 2 && totalAdminParticipants === 0) {
            existingConvo = convo;
            break;
          }
        }
      }

      if (existingConvo) {
        const conversation = await Conversation.findByPk(existingConvo.conversation_id);
        socket.emit("conversationStarted", conversation);
      } else {
        // If no conversation exists, create one
        const conversation = await Conversation.create();
        let participants = [socket.userId, recipientId];

        await UserConversation.bulkCreate(
          participants.map(p_id => ({
            citizen_id: p_id,
            conversation_id: conversation.conversation_id,
          }))
        );

        participants.forEach((u) => {
          io.to(`user:${u}`).emit("conversationStarted", conversation);
        });
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

    socket.on("sendMessage", async ({ conversationId, text }) => {
      if (!socket.userId) return socket.emit("authError", { message: "Not authorized." });
      if (!conversationId) return socket.emit("authError", { message: "Conversation not established." });

      // Save user's message
      const message = await Message.create({
        conversation_id: conversationId,
        senderId: socket.userId,
        text,
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
        console.log("Bot will respond to citizen message");
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

        console.log("Gemini history length:", geminiHistory.length);
        const botResponseText = await getGeminiResponse(geminiHistory, socket.role, socket.userId, socket.region);
        console.log("Bot response:", botResponseText);

        if (botResponseText === '__HUMAN_INTERVENTION__') {
          // Notify admins about human intervention request
          const { Admin } = require('../model/user.js');
          const admins = await Admin.findAll({
            where: { region: socket.region || 'default' } // Assuming region is set on socket
          });

          const humanInterventionMessage = await Message.create({
            conversation_id: conversationId,
            senderId: BOT_USER_ID,
            text: "I've transferred your request to a human administrator. An admin will assist you shortly.",
          });

          citizenParticipants.forEach((p) => {
            io.to(`user:${p.citizen_id}`).emit("newMessage", humanInterventionMessage);
          });
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

      // Notify the citizen that an admin has joined
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
