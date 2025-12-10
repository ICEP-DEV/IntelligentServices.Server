import express from "express";
import { getGeminiResponse, BOT_USER_ID } from "../config/Gemini.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import { authorizeRole } from "../middlewares/authorizeRole.js";
import { Conversation, Message } from "../model/message.js";
import AdminConversation from "../model/AdminConversation.js";
import { sequelize } from "../model/index.js";
import { Op } from "sequelize";

const router = express.Router();

/**
 * POST /admin/chatbot
 * Handles chatbot interactions specifically for admin users.
 */
router.post("/chatbot", authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { history, conversationId: convIdFromReq } = req.body;
  const userId = req.user.id;

  if (!history || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "Chat history is required." });
  }

  const last = history[history.length - 1];
  const userText = last?.parts?.[0]?.text;

  if (!userText || userText.trim() === "") {
    return res.status(400).json({ error: "User message text is required." });
  }

  let conversationId = convIdFromReq;

  try {
    // If no conversationId is provided, find or create a 1-on-1 chat with the bot.
    if (!conversationId) {
      const userConvos = await AdminConversation.findAll({ where: { admin_id: userId }, attributes: ["conversation_id"] });
      const userConvoIds = userConvos.map((c) => c.conversation_id);
      let existingConvoId = null;

      if (userConvoIds.length > 0) {
        const botConvos = await AdminConversation.findAll({
          where: { admin_id: BOT_USER_ID, conversation_id: { [Op.in]: userConvoIds } },
          attributes: ["conversation_id"],
        });
        const sharedConvoIds = botConvos.map((c) => c.conversation_id);

        for (const convoId of sharedConvoIds) {
          const adminCount = await AdminConversation.count({ where: { conversation_id: convoId } });
          // An admin-bot chat has exactly 2 admins (the user and the bot) and 0 citizens.
          if (adminCount === 2) {
            existingConvoId = convoId;
            break;
          }
        }
      }

      if (existingConvoId) {
        conversationId = existingConvoId;
      } else {
        const newConversation = await Conversation.create({});
        conversationId = newConversation.conversation_id;
        await Promise.all([
          AdminConversation.create({ admin_id: userId, conversation_id: conversationId }),
          AdminConversation.create({ admin_id: BOT_USER_ID, conversation_id: conversationId }),
        ]);
      }
    }

    // Save user message, get bot response, and save bot response
    await Message.create({ conversation_id: conversationId, senderId: userId, text: userText });
    const botResponseText = await getGeminiResponse(history, 'admin', userId, req.user.region);
    await Message.create({ conversation_id: conversationId, senderId: BOT_USER_ID, text: botResponseText });

    return res.json({ text: botResponseText, conversationId });
  } catch (error) {
    console.error("Error in Admin Chatbot:", error);
    return res.status(500).json({ text: "MuniBot is temporarily unavailable." });
  }
});

export default router;