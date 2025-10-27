import express from 'express'
import { Query,QueryType} from "../model/queries.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import checkSuspended from '../middlewares/checkSuspended.js';
import { Citizen, MunicipalPersonnel } from '../model/user.js';

const router = express.Router();

//get 
router.get('/getqueries',authenticateToken, async (req, res) => {
    try {
        const {id, role, region } = req.user;

        let whereClause = {}

        if(role === "citizen"){
            whereClause = {citizen_id: id}
        }else if(role === "admin"){
            whereClause = {region}
        }

        const queries = await Query.findAll({
        
            where: whereClause,
            include: [{ model: QueryType, attributes: ["query_type", "query_subtype"] }],
            order: [["createdAt", "DESC"]],

            attributes: ['query_id',
                 'query_description', 
                ['query_status','status'], 
                 'query_address','region',
                 'createdAt', 
            ],
            
            


        })
        res.status(200).json(queries);
    } catch (error) {
        console.error("Get Queries Error:", error);
        res.status(500).json({ error: "Failed to retrieve queries" });
    }
});

router.get('/assigned-queries',authenticateToken, async (req, res) => {
    try {
        const {id} = req.user;
        
        const technician = await MunicipalPersonnel.findByPk(id, {
            include: [
                {
                    model: Query,
                    through: { attributes: [] }
                }
            ]
        });

        if(!technician){
            res.status(404).json("No Technicians are found in this region");
        }

        res.json({assignedQueries: technician});
    } catch (error) {
        console.error("Get Queries Error:", error);
        res.status(500).json({ error: "Failed to retrieve queries" });
    }
})

export default router;
