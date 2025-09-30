import express from "express";
import  { getSocket } from "../config/socket.js";

const router = express.Router();

router.post("/send", (req, res) => {
    const { room, message, type} = req.body;
     console.log("POST /send hit", req.body); 
    
    try {
        const io = getSocket();

        io.to(room).emit("notification", {type,message});

        res.json({status: "success", message: "Notification sent successfully"});
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error",message: "Failed to send notification"});
    }
});

export default router;