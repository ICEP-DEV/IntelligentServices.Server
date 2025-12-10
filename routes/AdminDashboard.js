import express from 'express'
import {Query, QueryType,Attachment} from '../model/queries.js'
import { sequelize } from '../config/dbconfig.js';
import {Citizen} from '../model/user.js'
import authenticateToken from '../middlewares/authenticateToken.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';
import checkSuspended from '../middlewares/checkSuspended.js';


const router = express.Router();

router.get('/viewtotalrequest',
    authenticateToken,
    checkSuspended,
    authorizeRole(["admin"]),
    async(req,res) => {

    try {
        const queries = await Query.findAll({
        attributes: ['query_description', 'query_status', 'query_address'],
        include: {
            model: QueryType,
            attributes: ['query_type','query_subtype'],
        }
    });
       res.status(201).json(queries);

    } catch (error) {
        console.error(error);
        res.status(500).json({error:"Database error"})
    }
    

})

router.get('/totalrequest', async(req,res) =>{

    try {
          const total = await Query.count();
          res.json({ total });

    } catch (error) {
        console.error(error);
        res.status(500).json({error:"Database error"})
    }
})

router.get('/viewrequestdetails', async(req,res) => {

    try {
        const queries = await Query.findAll({
        attributes: ['query_description', 'query_address','createdAt',],
        include: [
            {
            model:QueryType,
            attributes: ['query_type','query_subtype'],
        },
        {
            model:Citizen,
            attributes: ['firstname','lastname'],
        },
        {
            model: Attachment,
            attributes: ['photo_url'],
        }
    ]
    
    });


       res.status(201).json(queries);

    } catch (error) {
        console.error(error);
        res.status(500).json({error:"Database error"})
    }
    

})
export default router;