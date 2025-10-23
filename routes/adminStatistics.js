import express from 'express'
import { Query, QueryType } from "../model/queries.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import { UnResolvedQueries } from "../model/complaints.js";

const router = express.Router()

router.get('/admin_stats' , async (req , res) => {

    //global counts for admin
    const totalLodged = await Query.count();
    const totalComplaints = await UnResolvedQueries.count()
    const totalRequests = totalLodged + totalComplaints;
    const totalCompleted = await Query.count();
    const totalUrgent = await Query.count();

    //global view
    const viewQueries = await Query.findAll({
       include: [{ model: QueryType, attributes: ["query_type", "query_subtype"] }],
      order: [["createdAt", "DESC"]],
    })
    const viewComplaints = await UnResolvedQueries.findAll()
    const trackStatus = await Query.findAll({
      order: [["createdAt", "DESC"]],
      attributes: ["query_status"]
    })

    try {
         res.json({
            counts : {totalRequests},
            viewQueries,viewComplaints,trackStatus
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
        
    }



}) 

export default router