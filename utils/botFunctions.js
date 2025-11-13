import { Query, QueryType, Attachment } from "../model/queries.js";
import { UnResolvedQueries } from "../model/complaints.js";

/**
 * Lodges a new query on behalf of a user.
 * @param {object} args - The arguments for lodging the query.
 * @param {string} userId - The ID of the user lodging the query.
 * @returns {object} - A confirmation or error message.
 */
export async function lodgeQuery(args, userId) {
  const { query_type, query_subtype, query_address, query_description, region } = args;

  if (!query_type || !query_subtype || !query_address || !query_description || !region) {
    return { success: false, error: "Missing required fields to lodge a query." };
  }

  try {
    const [queryTypeRecord] = await QueryType.findOrCreate({
      where: { query_type, query_subtype },
    });

    const newQuery = await Query.create({
      query_description,
      querytype_id: queryTypeRecord.querytype_id,
      query_address,
      citizen_id: userId,
      region,
    });

    return { success: true, message: `Query lodged successfully. The query ID is ${newQuery.query_id}.` };
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