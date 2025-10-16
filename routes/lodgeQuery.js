
import express  from  'express'
import crypto from 'crypto'
import { Query,QueryType,Attachment } from "../model/queries.js";
import multer from "multer" ;
import { Citizen} from '../model/user.js';
import {authenticateToken} from "../middlewares/authenticateToken.js";

const router = express.Router()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post('/lodgequery',authenticateToken, upload.single('photo'), async (req, res) => {
try{
    const{query_type,query_subtype,name,email,contact,query_address,region,query_description}=req.body
  
    
     if(hasNumber(name)) return res.status(406).json({ error: ' Invalid input !, Dont play with me !!!'})
   if(!query_type || !query_subtype ||!query_address || !query_description ){
       return res.status(400).json({ error: " All the fields must be  must be provided" });
    }

    //  if (!req.file) {
    // return res.status(400).json({ error: "Photo must be uploaded" });
    // }
    let photo_url = null;
    if (req.file) {
        const photo_url = req.file.path;
      }
        

    const [queryTypeRecord] = await QueryType.findOrCreate({
      where: { query_type, query_subtype },
      defaults: { query_type, query_subtype }
    });

    const newQuery = await Query.create({
    query_description,querytype_id: queryTypeRecord.querytype_id,query_address,citizen_id: req.user.id});

    const query_id = newQuery.query_id;

    if (req.file){
        const imageUpload = await Attachment.create({photo_url,query_id})
    }
  

    return res.status(200).json({message: "The Query has been lodged", query_id })
    
}catch(error){
    console.error("Lodge Query Error:", error);
    res.status(500).json({error: "failed to lodge query"})
}

})

export default router;
  