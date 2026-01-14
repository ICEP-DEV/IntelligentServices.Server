import express from "express";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { authorizeRole } from "../../middlewares/authorizeRole.js";
import { Query, QueryType } from "../../model/queries.js";
import { Citizen } from "../../model/user.js";
import { getPaginationOptions, formatPaginatedResponse } from "../../utils/pagination.js";

const router = express.Router();

router.get(
  "/getqueries",
  authenticateToken,
  authorizeRole(["superadmin"]),
  async (req, res) => {
    try {
      const { options, sanitizedLimit } = getPaginationOptions(req.query);

      const queries = await Query.findAll({
        ...options,
        attributes: ["query_id", "createdAt", "query_description", "query_status", "region", "priority_status"],
        include: [
          {
            model: QueryType,
            attributes: ["query_type", "query_subtype"],
          },
          {
            model: Citizen,
            attributes: ["citizen_id", "lastname","firstname"],
          },
        ],
      });

      res.status(200).json(formatPaginatedResponse(queries, sanitizedLimit));
    } catch (err) {
      console.error("Failed to fetch queries:", err);
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  }
);

export default router;
