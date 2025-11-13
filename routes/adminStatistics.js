import express from "express";
import { Query, QueryType } from "../model/queries.js";
import { UnResolvedQueries } from "../model/complaints.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import checkSuspended from "../middlewares/checkSuspended.js";
import { authorizeRole } from "../middlewares/authorizeRole.js";
import {Citizen} from "../model/user.js";


const router = express.Router();

router.get(
  "/admin_stats",
  authenticateToken,
  checkSuspended,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      // Global counts for admin
      const totalQueries = await Query.count();
      const totalComplaints = await UnResolvedQueries.count();
      const totalRequests = totalQueries + totalComplaints;

    //   const totalCompleted = await Query.count({ where: { query_status: "Completed" } });
    //   const totalUrgent = await Query.count({ where: { priority: "Urgent" } });

      //Global view of data for admin’s region
      const viewQueries = await Query.findAll({
        where: { region: req.user.region },
        include: [{ model: QueryType, attributes: ["query_type", "query_subtype"] },
                  {model: Citizen, attributes: ["firstname"]} ],
        order: [["createdAt", "DESC"]],
      });

      const viewComplaints = await UnResolvedQueries.findAll({
        include: [{ model: Citizen, attributes: ["firstname"] }],
        order: [["createdAt", "DESC"]],

      });

      const trackStatus = await Query.findAll({
        where: { region: req.user.region },
        order: [["createdAt", "DESC"]],
        attributes: ["query_status"],
      });

      //  Send everything back in expected format
      res.json({
        counts: {
          totalQueries,
          totalComplaints,
          totalRequests
        //   totalCompleted,
        //   totalUrgent,
        },
        viewQueries,
        viewComplaints,
        trackStatus,
      });
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  }
);

export default router;
