import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Generates a response from Gemini based on conversation history.
 * @param {Array} history - The conversation history in Gemini format.
 * @param {String} message - The new user message.
 * @returns {Promise<String>} - The bot's response.
 */
export const getBotResponse = async (history, message) => {
  try {
    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating bot response:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
};