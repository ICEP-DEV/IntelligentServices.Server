
import express  from  'express'
import crypto from 'crypto'
import { Query,QueryType } from "../models/queries.js";
 

const router = express.Router()

router.post('/lodgequery', async(req,res) =>{
try{
    const{query_type,query_subtype,name,email,contact,query_address,regiion,query_description,image,}=req.body

   if(!query_type || !query_subtype ||!query_address || !query_description ||!query_address){
       return res.status(400).json({ error: " All the fields must be  must be provided" });
    }

    const [queryTypeRecord] = await QueryType.findOrCreate({
      where: { query_type, query_subtype },
      defaults: { query_type, query_subtype }
    });

    const newQuery = await Query.create({
    query_description,querytype_id: queryTypeRecord.querytype_id,query_address});
    const reference = "REF-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    return res.status(200).json({message: "The Query has been lodged"})

}catch(error){
    console.error("Lodge Query Error:", error);
    res.status(500).json({error: "failed to lodge query"})
}

})

export default router;