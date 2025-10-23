import express from 'express'
import { Query,QueryType} from "../model/queries.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

//get 
router.get('/getqueries',authenticateToken , async (req, res) => {
    try {
     
        const queries = await Query.findAll({
        
            where: { citizen_id: req.user.id },
            include: [{ model: QueryType, attributes: ["query_type", "query_subtype"] }],
            order: [["createdAt", "DESC"]],

            attributes: ['query_id',
                 'query_description', 
                ['query_status','status'], 
                 'query_address', 
                 'createdAt', 
            ],
            
            


        })
        res.status(200).json(queries);
    } catch (error) {
        console.error("Get Queries Error:", error);
        res.status(500).json({ error: "Failed to retrieve queries" });
    }
});


export default router;
