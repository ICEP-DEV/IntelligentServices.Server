import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { lodgeQuery, lodgeComplaint } from "../utils/botFunctions.js";
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = "gemini-2.5-flash"; // You can switch to gemini-2.5-pro for higher quality

// 🧠 System Context
const SYSTEM_PROMPT = `
You are MuniBot, the assistant for the MunicipalHub system.
MunicipalHub is a public utility management platform focused ONLY on electricity and water services.
It connects citizens to regional admins and technicians who resolve reported issues.
Each query must include proof of resolution (images/videos) and can only be marked complete when approved by the citizen.
A superadmin oversees all users, queries, and reports to ensure transparency and accountability.
You can lodge queries and complaints on behalf of the user if they ask.

Citizen Users:
- If a citizen is NOT satisfied with their service, they can lodge a complaint for that query.
- After every response, encourage citizens to leave feedback on the citizen dashboard.
- If the question is outside your scope, forward it to the ADMIN user.
- If a user asks to attach a file or image, inform them that file attachments are not supported in the chat. Guide them to use the "Lodge a Query" or "Lodge a Complaint" forms to submit files.
- Interact mainly with citizens; if the user is admin, handle general system or municipal queries.

Citizen Status Flow:
- Submitted: query submitted
- Assigned: technician assigned
- Onsite/Onroute: technician attending
- Completed: technician done
- Marked Completed: citizen confirms fix
- Not Marked: citizen unsatisfied
`;

const ADMIN_SYSTEM_PROMPT = `
You are MuniBot, the assistant for the MunicipalHub system.
You are speaking to an Administrator. Your role is to provide them with information, answer questions about system functionalities, and help them manage municipal operations.

Admin Functions:
- Admins can view all queries within their region.
- They can assign technicians to queries.
- They can monitor the status of ongoing work.
- They can view dashboards and statistics related to service performance.
- If an admin asks about attaching files, inform them this feature is not available in the chat interface.

Your tone should be professional, informative, and direct. You can answer questions about system features, data retrieval, or provide summaries of regional activity.
`;

// Use a static UUID for the bot to act as an admin.
export const BOT_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * A helper function to retry an async operation.
 * @param {Function} fn The async function to execute.
 * @param {number} retries Number of retries.
 * @param {number} delay Delay between retries in ms.
 * @returns {Promise<any>}
 */
const withRetry = async (fn, retries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error.status === 503) { // Only retry on 503 Service Unavailable
        console.log(`Gemini API overloaded. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, delay * (i + 1))); // Exponential backoff
      } else {
        throw error; // Re-throw other errors immediately
      }
    }
  }
  throw lastError;
};

const tools = [
  {
    functionDeclarations: [
      {
        name: "lodgeQuery",
        description: "Lodge a new query for a citizen about an electricity or water issue.",
        parameters: {
          type: "OBJECT",
          properties: {
            query_type: { type: "STRING", description: "The main category of the issue (e.g., 'Electricity', 'Water')." },
            query_subtype: { type: "STRING", description: "The specific type of issue (e.g., 'Power Outage', 'No Water')." },
            query_address: { type: "STRING", description: "The full address where the issue is occurring." },
            query_description: { type: "STRING", description: "A detailed description of the problem." },
            region: { type: "STRING", description: "The municipal region for the address." },
          },
          required: ["query_type", "query_subtype", "query_address", "query_description", "region"],
        },
      },
      {
        name: "lodgeComplaint",
        description: "Lodge a complaint against an existing query for a citizen.",
        parameters: {
          type: "OBJECT",
          properties: {
            query_id: { type: "STRING", description: "The ID of the existing query to complain about." },
            description: { type: "STRING", description: "A detailed description of the complaint." },
          },
          required: ["query_id", "description"],
        },
      },
    ],
  },
];

const availableTools = {
  lodgeQuery,
  lodgeComplaint,
};

const model = genAI.getGenerativeModel({
  model: MODEL,
  tools: tools,
});

/**
 * Generates Gemini response using @google/genai
 * @param {Array<{ role: string, parts: Array<{ text: string }> }>} history
 * @param {string} userRole - The role of the user ('citizen' or 'admin').
 * @returns {Promise<string>} - AI response text
 */
export const getGeminiResponse = async (history = [], userRole = 'citizen', userId, region) => {
  try {
    // 🔎 Detect requests for human intervention
    const lastUserMessage = history.filter((msg) => msg.role === "user").pop();
    const userText = lastUserMessage?.parts?.[0]?.text?.toLowerCase() || "";

    if (
      ["talk to human", "speak to admin", "real person", "human assistance"].some((phrase) =>
        userText.includes(phrase)
      )
    ) {
      return "__HUMAN_INTERVENTION__";
    }

    const activePrompt = userRole === 'admin' ? ADMIN_SYSTEM_PROMPT : SYSTEM_PROMPT;

    const contents = [
      { role: "user", parts: [{ text: activePrompt }] },
      { role: "model", parts: [{ text: "Understood. I will act in accordance with these instructions." }] },
      ...history,
    ];
    
    const chat = model.startChat({ history: contents });
    const result = await withRetry(() => chat.sendMessage(userText));

    const response = result.response;
    const call = response.functionCalls()?.[0];

    if (call) {
      console.log("Gemini wants to call a function:", call.name, call.args);
      const apiResponse = await availableTools[call.name](call.args, userId, region);
      
      const result2 = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: apiResponse,
          },
        },
      ]);
      const response2 = result2.response;
      return response2.text() || "Action completed.";
    }

    const output = response.text();
    return output ? output.trim() : "I'm sorry, I couldn't process that. Can you try again?";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "MuniBot is temporarily unavailable. Please try again later.";
  }
};
