import express from "express";
import { Query, QueryType } from "../model/queries.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

router.get("/queries/by-type/:type", authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;

    const queries = await Query.findAll({
      include: [
        {
          model: QueryType,
          attributes: ["query_type"],
          where: { query_type: type },
        },
      ],
      order: [["createdAt", "DESC"]],
      attributes: ["query_id"],
    });


    const queryIds = queries.map((q) => ({ query_id: q.query_id }));

    res.status(200).json(queryIds);
  } catch (error) {
    console.error("Get Queries by Type Error:", error);
    res.status(500).json({ error: "Failed to retrieve queries by type" });
  }
});

export default router;
