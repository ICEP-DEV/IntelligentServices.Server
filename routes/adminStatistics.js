import express from "express";
import { Query, QueryType,Attachment } from "../model/queries.js";
import { ComplaintAttachments, UnResolvedQueries } from "../model/complaints.js";
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
      const totalQueries = await Query.count({
           where: { region: req.user.region },
     
      }
      );
   const totalComplaints = await UnResolvedQueries.count({
  include: [
    {
      model: Query,
          attributes: [],      
          where: { region: req.user.region },
           required: true 
        }
      ]
    });

      const totalRequests = totalQueries + totalComplaints;

      // Global view of data for admin’s region
      const viewQueries = await Query.findAll({
        where: { region: req.user.region },
        include: [
          { model: QueryType, attributes: ["query_type", "query_subtype"] },
          { model: Citizen, attributes: ["firstname"] },
          { model: Attachment, attributes: ["photo_path"] }
        ],
        order: [["createdAt", "DESC"]],
      });

      const host = req.get("host"); 
      const viewQueriesWithImages = viewQueries.map(query => {
        const attachmentsWithUrls = (query.attachments || [])
          .filter(att => att.photo_path) 
          .map(att => ({
            ...att.toJSON(),
            photo_url: `http://${host}/uploads/${att.photo_path}`
          }));

        return {
          ...query.toJSON(),
          attachments: attachmentsWithUrls
        };
      });

      const viewComplaints = await UnResolvedQueries.findAll({
        include: [{ model: Citizen, attributes: ["firstname"]},
        { model: ComplaintAttachments, attributes: ["photo_path"]},
         { model: Query, attributes: [],      
            where: { region: req.user.region },
             required: true 
        }
      ],
        order: [["createdAt", "DESC"]],
      });
        const viewComplaintsWithImages = viewComplaints.map(unresolvedQueries => {
        const attachmentsWithUrls = (unresolvedQueries.ComplaintAttachments || [])
          .filter(att => att.photo_path)
          .map(att => ({
            ...att.toJSON(),
            photo_url: `http://${req.get("host")}/uploads/${att.photo_path}`
          }));

        return {
          ...unresolvedQueries.toJSON(),
          attachments: attachmentsWithUrls
        };
      });

      const trackStatus = await Query.findAll({
        where: { region: req.user.region },
        order: [["createdAt", "DESC"]],
        attributes: ["query_status"],
      });

      // Send everything back
      res.json({
        counts: {
          totalQueries,
          totalComplaints,
          totalRequests,
        },
        viewQueries: viewQueriesWithImages,
        viewComplaints: viewComplaintsWithImages,
        trackStatus,
      });
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  }
);

export default router;
