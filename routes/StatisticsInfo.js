import express from "express";
import { Query, QueryType } from "../model/queries.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import { UnResolvedQueries } from "../model/complaints.js";
import checkSuspended from "../middlewares/checkSuspended.js";
const router = express.Router();

// GET /api/dashboard
router.get("/stats",authenticateToken,checkSuspended, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Counts for specific citizen
    const totalQueries = await Query.count({ where: { citizen_id: user.id } });
    const totalComplaints = await UnResolvedQueries.count({ where: { citizen_id: user.id } });
    const totalRequests = totalQueries + totalComplaints;


    // Active queries for this citizen
    const activeQueries = await Query.findAll({
      where: { citizen_id: user.id, query_status: "submitted" },
      include: [{ model: QueryType, attributes: ["query_type", "query_subtype"] }],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    // Latest complaints for this citizen
    const updates = await UnResolvedQueries.findAll({
      where: { citizen_id: user.id },
      order: [["createdAt", "DESC"]],
      limit: 5,
      attributes: ["id", "query_type", "reference", "description", "createdAt"],
    });

    // Query history for this citizen
    const lodgedQueries = await Query.findAll({
      where: { citizen_id: user.id },
      order: [["createdAt", "DESC"]],
      attributes: ["query_description", "query_status", "createdAt"],
      include: [{ model: QueryType, attributes: ["query_type"] }],
    });

    // Complaint history for this citizen
    const complaintHistory = await UnResolvedQueries.findAll({
      where: { citizen_id: user.id },
      order: [["createdAt", "DESC"]],
      attributes: ["createdAt", "query_type", "complaint_status", "description",],
    });

    res.json({
      counts: { totalQueries, totalComplaints, totalRequests },
      activeQueries,
      lodgedQueries,
      complaintHistory,
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