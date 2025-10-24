import express from "express";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { authorizeRole } from "../../middlewares/authorizeRole.js";
import { Query, QueryType } from "../../model/queries.js";
import { Citizen } from "../../model/user.js";

const router = express.Router();

router.get(
  "/getqueries",
  authenticateToken,
  authorizeRole(["superadmin"]),
  async (req, res) => {
    try {
      const queries = await Query.findAll({
        attributes: ["query_description", "query_status", "region", "priority_status"],
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

      res.status(200).json({ queries });
    } catch (err) {
      console.error("Failed to fetch queries:", err);
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  }
);

export default router;
