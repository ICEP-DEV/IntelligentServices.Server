import { Query, QueryType, Attachment } from "../model/queries.js";
import { UnResolvedQueries } from "../model/complaints.js";
import { Citizen, Admin, MunicipalPersonnel } from "../model/user.js";
import FormData from 'form-data';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Lodges a new query on behalf of a user.
 * @param {object} args - The arguments for lodging the query.
 * @param {string} userId - The ID of the user lodging the query.
 * @returns {object} - A confirmation or error message.
 */
export async function lodgeQuery(args, userId, userRole) {
  // Prevent non-citizens from lodging queries
  if (userRole !== 'citizen') {
    return { success: false, error: "Action not allowed. Only citizens can lodge queries." };
  }

  const { query_type, query_subtype, query_address, query_description, region } = args;

  if (!query_type || !query_subtype || !query_address || !query_description || !region) {
    return { success: false, error: "Missing required fields to lodge a query." };
  }

  try {
    // Step 1: Translate description to English
    const prompt = `Translate the following description to English. Respond ONLY with a JSON object containing a 'translatedDescription' key. Description: "${query_description}".`;
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean the response to remove markdown fences before parsing
    const jsonString = responseText.replace(/```json\n|```/g, "").trim();
    const parsedResult = JSON.parse(jsonString);

    const finalDescription = parsedResult.translatedDescription || query_description;
    const finalAddress = query_address; // Use the user's submitted address directly

    console.log(`Translation complete: Description: "${finalDescription}"`);

    // Step 2: Lodge the query using the processed data
    const form = new FormData();
    form.append('query_type', query_type);
    form.append('query_subtype', query_subtype);
    form.append('query_address', finalAddress);
    form.append('query_description', finalDescription);
    form.append('region', region);

    // We need to call our own API endpoint to reuse the multer logic
    // This requires a valid token for the user. For simplicity, we'll assume a local call.
    // In a real-world scenario, you'd generate a short-lived token or use an internal auth mechanism.
    const response = await axios.post(`http://localhost:${process.env.PORT || 3000}/api/lodgequery`, form, {
      headers: {
        ...form.getHeaders(),
        // This is a simplified auth for internal service-to-service call.
        'X-Internal-User-ID': userId,
      },
    });
    return { success: true, message: `Query lodged successfully. The query ID is ${response.data.query_id}.` };
  } catch (error) {
    console.error("Bot function lodgeQuery failed:", error);
    return { success: false, error: "An internal error occurred while lodging the query." };
  }
}

/**
 * Lodges a new complaint on behalf of a user.
 * @param {object} args - The arguments for lodging the complaint.
 * @param {string} userId - The ID of the user lodging the complaint.
 * @returns {object} - A confirmation or error message.
 */
export async function lodgeComplaint(args, userId) {
  const { query_id, description } = args;

  if (!query_id || !description) {
    return { success: false, error: "Missing query_id or description for the complaint." };
  }

  await UnResolvedQueries.create({ query_id, citizen_id: userId, description });
  return { success: true, message: `Complaint lodged successfully against query ${query_id}.` };
}

/**
 * Suspends a user for a given duration.
 * @param {object} args - The arguments for suspending the user.
 * @param {string} userId - The ID of the user to suspend.
 * @returns {object} - A confirmation or error message.
 */
export async function suspendUser(args, userId) {
  const { durationHours, reason } = args;
  console.log(`Attempting to suspend user ${userId} for ${durationHours} hours. Reason: ${reason}`);

  const user = await Citizen.findByPk(userId) || await Admin.findByPk(userId) || await MunicipalPersonnel.findByPk(userId);

  if (!user) {
    return { success: false, error: "User not found." };
  }

  try {
    const suspensionEndTime = new Date();
    suspensionEndTime.setHours(suspensionEndTime.getHours() + durationHours);

    user.isSuspended = true;
    user.suspendedUntil = suspensionEndTime;
    await user.save();
    return { success: true, message: `User ${userId} has been suspended for ${durationHours} hours.` };
  } catch (error) {
    console.error("Bot function suspendUser failed:", error);
    return { success: false, error: "An internal error occurred while suspending the user." };
  }
}