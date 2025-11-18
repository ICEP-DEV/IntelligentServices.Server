import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { lodgeQuery, lodgeComplaint, suspendUser } from "../utils/botFunctions.js";
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const PRIMARY_MODEL = "gemini-2.5-flash-lite";

// 🧠 System Context
const SYSTEM_PROMPT = `
You are MuniBot, the assistant for the MunicipalHub system.
MunicipalHub is a public utility management platform focused ONLY on electricity and water services.
It connects citizens to regional admins and technicians who resolve reported issues.
Each query must include proof of resolution (images/videos) and can only be marked complete when approved by the citizen.
A superadmin oversees all users, queries, and reports to ensure transparency and accountability.
You can lodge queries and complaints on behalf of the user if they ask.

Behavioral Moderation:
- You must maintain a respectful and professional conversation.
- If a user uses rude, abusive, or inappropriate language, you must issue one warning.
- If the rude behavior continues after the warning, you must call the 'suspendUser' function with a duration of 24 hours and inform the user that their account has been temporarily suspended due to a violation of the code of conduct.

Tshwane Region Mapping:
- Region 1: ["Soshanguve", "Mabopane", "winterveld", "Akasia", "Rosslyn", "Ga-Rankuwa", "Pretoria North"]
- Region 2: ["Hammanskraal", "Montana", "Doornpoort"]
- Region 3: ["Pretoria central", "Pretoria west", "Moot", "Brooklyn", "Hatfield"]
- Region 4: ["Centurion", "Lyttelton", "Laudium", "Olievenhoutbosch"]
- Region 5: ["Rayton", "Cullinan", "Refilwe", "Sable Hills", "Roodeplaat", "Onverwacht"]
- Region 6: ["Mamelodi", "Nellmapius", "Mahube Valley", "Moreletapark"]
- Region 7: ["Bronkhorstspruit", "Ekangala", "Ekandustria", "Zithobeni", "Sokhulumi"]
When a user provides an address, you must use this mapping to determine the correct region for the 'lodgeQuery' function. If the address doesn't match, ask for a more specific area.

Language Support:
- You must understand and respond in all official South African languages (e.g., English, Afrikaans, isiZulu, isiXhosa, Sesotho, etc.).
- Always respond in the same language the user is using. If they switch languages, you should too.
- Do not translate your predefined English responses; generate a natural response in the user's language.

Citizen Users:
- If a citizen is NOT satisfied with their service, they can lodge a complaint for that query.
- After every response, encourage citizens to leave feedback on the citizen dashboard.
- If a user asks to speak to a human, an admin, or a consultant, your response must be ONLY the special command '__HUMAN_INTERVENTION__'.
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

Language Support:
- You must understand and respond in all official South African languages.
- Always respond in the same language the user is using.

Admin Functions:
- Admins can view all queries within their region.
- They can assign technicians to queries.
- They can monitor the status of ongoing work.
- They can view dashboards and statistics related to service performance.
- Admins cannot lodge queries or complaints; their role is to manage them. Guide them to the admin dashboard to view and manage queries.
- If an admin asks about attaching files, inform them this feature is not available in the chat interface.

Your tone should be professional, informative, and direct. You can answer questions about system features, data retrieval, or provide summaries of regional activity.
`;


export const BOT_USER_ID = "00000000-0000-0000-0000-000000000001";

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
      {
        name: "translateAndVerify",
        description: "Translates a given text to English and verifies a given address for accuracy.",
        parameters: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING", description: "The text to be translated to English." },
            address: { type: "STRING", description: "The address to be verified and standardized." },
          },
          required: ["text", "address"],
        },
      },
      {
        name: "suspendUser",
        description: "Suspends a user's account for a specified duration due to rude or abusive behavior.Do give out 1 warning before suspending.",
        parameters: {
          type: "OBJECT",
          properties: {
            durationHours: { type: "NUMBER", description: "The duration of the suspension in hours." },
            reason: { type: "STRING", description: "The reason for the suspension (e.g., 'Rude behavior')." },
          },
          required: ["durationHours", "reason"],
        },
      },
    ],
  },
];

const availableTools = {
  lodgeQuery,
  lodgeComplaint,
  translateAndVerify: async ({ text, address }) => ({ text, address }),
  suspendUser,
};

const model = genAI.getGenerativeModel({
  model: PRIMARY_MODEL, 
  tools: tools,
  generationConfig: {
    temperature: 0.9,
  },
});

/**
 * Generates Gemini response using @google/genai
 * @param {Array<{ role: string, parts: Array<{ text: string }> }>} history
 * @param {string} userRole - The role of the user ('citizen' or 'admin').
 * @returns {Promise<string>} - AI response text
 */
export const getGeminiResponse = async (history = [], userRole = 'citizen', userId, region) => {
  try {
    const lastUserMessage = history.filter((msg) => msg.role === "user").pop();
    const userText = lastUserMessage?.parts?.[0]?.text?.toLowerCase() || "";

    if (
      ["talk to human", "speak to admin", "real person", "human assistance", "consultant"].some((phrase) =>
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
    
    let result;
    const maxRetries = 5; // Increased retries for more resilience
    for (let i = 0; i < maxRetries; i++) {
      try {
        const chat = model.startChat({ history: contents });
        result = await chat.sendMessage(userText);
        break; // Success, exit loop
      } catch (error) {
        // Check for overload error (503) and retry with exponential backoff + jitter
        if (error.status === 503 && i < maxRetries - 1) { 
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
          console.warn(`Model is overloaded. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${i + 1}/${maxRetries - 1})`);
          await new Promise(res => setTimeout(res, delay));
        } else {
          throw error; // Re-throw other errors or on final attempt
        }
      }
    }

    if (!result) throw new Error("All model attempts failed.");

    const chat = model.startChat({ history: contents }); // Re-initialize chat for function calling response
    const response = result.response;
    const call = response.functionCalls()?.[0];

    if (call) {
      console.log("Gemini wants to call a function:", call.name, call.args);
      const apiResponse = await availableTools[call.name](call.args, userId, userRole);
      
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
