import express from "express";
import  { getSocket } from "../config/socket.js";
import Feedback from "../models/feedback.js";
import Feedback from "./feedback.js";
import { Citizen } from "../models/user.js";

const router = express.Router();

router.post('/citizen/feedback', async (req ,res) =>{
    try {
        const {citizen_id,message,rating} = req.body;

        if(!message){
            res.status(400).json("Message is required");
        }
        const feedback = await Feedback.create({
            message,
            rating,
            citizen_id,
    });

        res.status(201).json({
      success: true,
      feedback
    });
    } catch (err) {
       console.log("Error getting Feedback information: ",err);
       res.status(500).json({ error: "Failed to submit feedback" }); 
    }
});

router.get('/admin/feedback', async (req, res) =>{

    try {
        const citizenFeedback = await Feedback.findAll({
            attributes: ['message','rating'],
            include: [{
                model: Citizen,
                attributes: ['email', 'firstname', 'lastname'],
            }]
        });
        
        res.status(201).json({"data": citizenFeedback});

    } catch (err) {
        console.log("Error getting Feedback information: ",err);
        res.status(500).json({ error: "Failed to fetch feedback" });
    }
})

export default router;