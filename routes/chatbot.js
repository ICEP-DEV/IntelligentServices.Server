import express from "express";
import { getGeminiResponse, BOT_USER_ID } from "../config/Gemini.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import { Conversation, Message } from "../model/message.js";
import AdminConversation from "../model/AdminConversation.js";
import UserConversation  from "../model/CitizenConversation.js";
import { sequelize } from "../model/index.js";
import { fn, col, Op } from "sequelize";

const router = express.Router();

/**
 * @route   POST /chatbot
 * @desc    Get a response from the Gemini chatbot
 * @access  Private
 */
router.post("/chatbot", authenticateToken, async (req, res) => {
  const { history, conversationId: convIdFromReq } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "Chat history is required." });
  }

  try {
    let conversationId = convIdFromReq;

    // 1. Find or create a conversation if no ID is provided
    if (!conversationId) {
      let existingConvo = null;
      // Logic for finding an existing 1-on-1 convo with the bot
      if (userRole === 'citizen') {
        const citizenConvos = await UserConversation.findAll({ where: { citizen_id: userId }, attributes: ['conversation_id'] });
        const citizenConvoIds = citizenConvos.map(c => c.conversation_id);
  
        if (citizenConvoIds.length > 0) {
            const botAndCitizenConvo = await AdminConversation.findOne({
                where: {
                    conversation_id: { [Op.in]: citizenConvoIds },
                    admin_id: BOT_USER_ID
                }
            });
    
            if(botAndCitizenConvo){
                const convo = botAndCitizenConvo;
                const totalCitizenParticipants = await UserConversation.count({ where: { conversation_id: convo.conversation_id } });
                const totalAdminParticipants = await AdminConversation.count({ where: { conversation_id: convo.conversation_id } });
                
                if (totalCitizenParticipants === 1 && totalAdminParticipants === 1) {
                  existingConvo = convo;
                }
            }
          }
      }

      if (existingConvo) {
        conversationId = existingConvo.conversation_id;
      } else {
        const newConversation = await Conversation.create();
        // Create conversation based on user role
        if (userRole === 'citizen') {
            await Promise.all([
              UserConversation.create({ citizen_id: userId, conversation_id: newConversation.conversation_id }),
              AdminConversation.create({ admin_id: BOT_USER_ID, conversation_id: newConversation.conversation_id })
            ]);
        } else if (userRole === 'admin') {
            await Promise.all([
              AdminConversation.create({ admin_id: userId, conversation_id: newConversation.conversation_id }),
              AdminConversation.create({ admin_id: BOT_USER_ID, conversation_id: newConversation.conversation_id })
            ]);
        }
        conversationId = newConversation.conversation_id;
      }
    }

    // 2. Save the user's message
    const userMessage = history[history.length - 1];
    await Message.create({
      conversation_id: conversationId,
      senderId: userId,
      text: userMessage.parts[0].text,
    });

    // 3. Get response from Gemini
    const botResponseText = await getGeminiResponse(history, userRole, userId, req.user.region);

    // 4. Save the bot's response
    await Message.create({
      conversation_id: conversationId,
      senderId: BOT_USER_ID, // senderId in Message can reference either citizen or admin
      text: botResponseText,
    });

    // 5. Send response back to the frontend
    res.json({ text: botResponseText, conversationId });
  } catch (error) {
    console.error("Error getting response from Gemini:", error);
    res
      .status(500)
      .json({ text: "MuniBot is temporarily unavailable. Please try again later." });
  }
});

export default router;