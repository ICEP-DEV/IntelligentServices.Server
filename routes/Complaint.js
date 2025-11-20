import express from "express";
import { Query, QueryType } from "../model/queries.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import { Op } from "sequelize";

const router = express.Router();

router.get("/queries/by-type/:type", authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const queries = await Query.findAll({
  where: {
    [Op.or]: [
      {
        query_status: "submitted",
        createdAt: { [Op.lt]: thirtyMinutesAgo } 
      },
      {
        query_status: { [Op.not]: "resolved" },
        createdAt: { [Op.lt]: sixHoursAgo }     
      }
    ]
  },
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
