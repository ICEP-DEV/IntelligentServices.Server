import { Op } from "sequelize";

const encodeCursor = (timestamp, id) => {
  return Buffer.from(`${timestamp.toISOString()}|${id}`).toString("base64");
};
const decodeCursor = (cursor) => {
  const decoded = Buffer.from(cursor, "base64").toString("ascii");
  const [timestamp, id] = decoded.split("|");
  return { timestamp: new Date(timestamp), id };
};
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

export const getPaginationOptions = (queryParams) => {
        const { cursor } = queryParams;

        let limit = parseInt(queryParams.limit) || DEFAULT_LIMIT;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;

        let options = {
            limit: limit,
            order: [["createdAt","DESC"], ["query_id", "DESC"]],
            where: {},
        }

        //cursor 
        if (cursor) {

        const { timestamp, id} = decodeCursor(cursor);
        //  (CreatedAt < CursorTime) OR (CreatedAt == CursorTime AND ID < CursorID)
        options.where[Op.or] = [
            {createdAt: { [Op.lt]: timestamp} },
            {
                [Op.and]: [ 
                    { createdAt: timestamp},
                    { query_id: { [Op.lt]: id}}
                ]
            }
        ];
    }

        return{
            options,
            sanitizedLimit: limit,
        };
    };

/**
 * Formats the response with metadata
 */
export const formatPaginatedResponse = (data, limit) => {
  const hasNextPage = data.length === limit;
  let nextCursor = null;

  if (hasNextPage) {
    const lastItem = data[data.length - 1];
    nextCursor = encodeCursor(lastItem.createdAt, lastItem.query_id);
  }

  return {
    data,
    meta: {
      nextCursor,
      hasNextPage
    }
  };
}