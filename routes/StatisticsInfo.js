import express from "express";
import { Query, QueryType} from "../model/queries.js";
import  { UnResolvedQueries } from '../model/complaints.js';
const router = express.Router();

// GET /api/dashboard
router.get("/stats", async (req, res) => {
  try {
    // Counts
    const totalQueries = await Query.count({ where: { query_status: "pending" } });
    const totalComplaints = await UnResolvedQueries.count();
    const totalRequests = totalQueries + totalComplaints;

    // Fetch active queries
    const activeQueries = await Query.findAll({
      where: { query_status: "pending" },
      include: [{ model: QueryType, attributes: ["query_type", "query_subtype"] }],
      order: [["createdAt", "DESC"]],
      limit: 10, // optional
    });

    // Fetch latest complaints as updates
    const updates = await UnResolvedQueries.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      attributes: ["id", "query_type", "query_service", "description", "createdAt"],
    });

    res.json({
      counts: { totalQueries, totalComplaints, totalRequests },
      activeQueries,
      updates: updates.map(u => ({
        id: u.id,
        message: `${u.query_type} - ${u.query_service}: ${u.description}`,
        date: u.createdAt.toISOString().split("T")[0],
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
