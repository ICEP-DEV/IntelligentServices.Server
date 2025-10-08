import express  from  'express'
import { UnResolvedQueries} from '../models/complaints.js';
import {authenticateToken} from "../middlewares/authenticateToken.js";
import {Query} from '../models/queries.js'
const router = express.Router();

router.post("/lodgecomplaint" ,authenticateToken, async(req,res)  =>{

const{query_type,query_service,description,query_id}=req.body

try {
    
    if(!query_type ||!description){
        return res.status(400).json({ error: " All the fields must be  must be provided" });
    }

     const recentQuery = await Query.findOne({
      where: { citizen_id: req.user.id },
      //order: [['createdAt', 'DESC']]  // gets the latest
    });

    const newUnresolved = await UnResolvedQueries.create({query_type,query_service,description,citizen_id: req.user.id,query_id:recentQuery.query_id})

    return res.status(200).json({message: "The complaint has been lodged"})
} catch (error) {
    console.error("Lodge Query Error:", error);
    res.status(500).json({error: "failed to lodge query"})
}

}) 

export default router;