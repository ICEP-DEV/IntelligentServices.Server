// routes/chatbot.js
import express from "express";
import { getGeminiResponse, BOT_USER_ID } from "../config/Gemini.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import { Conversation, Message } from "../model/message.js";
import UserConversation from "../model/CitizenConversation.js";
import { sequelize } from "../model/index.js";
import { Admin, Citizen } from "../model/user.js";
import { Op } from "sequelize";

const router = express.Router();

router.post("/chatbot", authenticateToken, async (req, res) => {
  const { history: newHistory, conversationId: convIdFromReq } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  // This route is now only for citizens. Admins should use the /api/admin/chatbot route.
  if (userRole !== 'citizen') {
    return res.status(403).json({ error: "Access denied. Admins should use the admin chatbot endpoint." });
  }

  if (!newHistory || !Array.isArray(newHistory) || newHistory.length === 0) {
    return res.status(400).json({ error: "Chat history is required." });
  }

  // Ensure the last entry has text
  const last = newHistory[newHistory.length - 1];
  const userText = 
    last && last.parts && Array.isArray(last.parts) && last.parts[0]
      ? last.parts[0].text
      : null;

  if (!userText || userText.trim() === "") {
    return res.status(400).json({ error: "User message text is required." });
  }

  let conversationId = convIdFromReq;
  let fullHistory = newHistory;

  try {
    if (conversationId) {
      // For subsequent messages, save the user's message first to include it in the history.
      await Message.create({ conversation_id: conversationId, senderId: userId, text: userText });
      // If a conversationId is provided, load the existing messages to build the full history.
      const existingMessages = await Message.findAll({
        where: { conversation_id: conversationId },
        order: [["createdAt", "DESC"]], 
        limit: 20, 
      });
      const formattedHistory = existingMessages
        .reverse()
        .map((msg) => ({
          role: msg.senderId === BOT_USER_ID ? "model" : "user",
          parts: [{ text: msg.text }],
        }));

      fullHistory = formattedHistory; // The full history is now from the DB
    } else {
      let existingConvo = null;
      const userConversations = await UserConversation.findAll({ where: { citizen_id: userId }, attributes: ["conversation_id"] });
      const userConvoIds = userConversations.map((c) => c.conversation_id);

      if (userConvoIds.length > 0) {
        // 2. Get all conversation IDs for the bot.
        const botConversations = await AdminConversation.findAll({
          where: { admin_id: BOT_USER_ID, conversation_id: { [Op.in]: userConvoIds } },
          attributes: ["conversation_id"],
        });
        const sharedConvoIds = botConversations.map((c) => c.conversation_id);

        // 3. For each shared conversation, check if it's a true 1-on-1 chat.
        for (const convoId of sharedConvoIds) {
          const adminCount = await AdminConversation.count({ where: { conversation_id: convoId } });
          const citizenCount = await UserConversation.count({ where: { conversation_id: convoId } });

          if (adminCount + citizenCount === 2) {
            existingConvo = { conversation_id: convoId };
            break; // Found the correct conversation, exit the loop.
          }
        }
      }

      if (existingConvo) {
        conversationId = existingConvo.conversation_id;
      } else {
        // If no valid conversation exists, create a new one.
        await sequelize.transaction(async (t) => {
          const newConversation = await Conversation.create({}, { transaction: t });
          conversationId = newConversation.conversation_id;
          await Promise.all([
            UserConversation.create({ citizen_id: userId, conversation_id: conversationId }, { transaction: t }),
            UserConversation.create( // This seems to be a typo in original, should be AdminConversation
              { admin_id: BOT_USER_ID, conversation_id: conversationId },
              { transaction: t }
            ),
          ]);
        });
      }
    }
    // Save the user's message if it's the first message in a new conversation
    if (!convIdFromReq) await Message.create({ conversation_id: conversationId, senderId: userId, text: userText });
    const botResponseText = await getGeminiResponse(fullHistory, userRole, userId, req.user.region); // fullHistory now contains multimodal content
    const savedBotMessage = await Message.create({
      conversation_id: conversationId,
      senderId: BOT_USER_ID,
      text: botResponseText,
    });

    return res.json({ text: botResponseText, conversationId });
  } catch (error) {
    console.error("Error getting response from Gemini:", error);
    return res
      .status(500)
      .json({ text: "MuniBot is temporarily unavailable. Please try again later." });
  }
});
export default router;
