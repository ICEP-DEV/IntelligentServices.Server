import readline from 'readline';
import dotenv from 'dotenv';
import { getGeminiResponse } from './config/Gemini.js';

// Load environment variables from .env file
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You: '
});

// --- Configuration ---
// You can change these mock values to test different user roles or regions.
const MOCK_USER = {
  id: 'console-admin-01',
  role: 'admin', // or 'citizen'
  region: 'Region 1'
};

const conversationHistory = [];

console.log("=======================================");
console.log("   MuniBot Console Tester (Admin Mode)");
console.log("=======================================");
console.log('Type your message and press Enter.');
console.log('Type "exit" or "quit" to end the session.');
console.log("---------------------------------------");

rl.prompt();

rl.on('line', async (line) => {
  const userInput = line.trim();

  if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
    rl.close();
    return;
  }

  // Add user message to history
  conversationHistory.push({ role: 'user', parts: [{ text: userInput }] });

  try {
    console.log("MuniBot is thinking...");

    // Get response from Gemini
    const botResponseText = await getGeminiResponse(conversationHistory, MOCK_USER.role, MOCK_USER.id, MOCK_USER.region);

    // Add bot response to history
    conversationHistory.push({ role: 'model', parts: [{ text: botResponseText }] });

    // Display bot response
    console.log(`MuniBot: ${botResponseText}`);

  } catch (error) {
    console.error("Error calling Gemini API:", error.message);
    // Remove the user's message from history if the API call failed
    conversationHistory.pop();
  }

  rl.prompt();
}).on('close', () => {
  console.log('Goodbye!');
  process.exit(0);
});
