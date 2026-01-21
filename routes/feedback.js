import express from "express";
import { getSocket } from "../config/socket.js";
import { Citizen } from "../model/user.js";
import authenticateToken from "../middlewares/authenticateToken.js";
import checkSuspended from "../middlewares/checkSuspended.js";
import { getFeedback } from "../controllers/FeedbackController.js";

const router = express.Router();

// Citizen feedback submission
router.post("/citizen",authenticateToken,checkSuspended, async (req, res) => {
  try {
    const { citizen_id, message, rating } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    const citizen = await Citizen.findOne({
    where: { citizen_id },
    attributes: ["firstname", "lastname"],
    });


    if (!citizen) {
      return res.status(404).json({ error: "Citizen not found" });
    }

    const feedback = await citizen.createFeedback({ message, rating });

    const io = getSocket();
    io.to("feedback-hub").emit("newFeedbackNotification", {
      citizen_id,
      name: `${citizen.firstname} ${citizen.lastname}`,
      message,
      rating,
      feedback_id: feedback.feedback_id,
      createdAt: feedback.createdAt,
    });

    res.status(201).json({
      success: true,
      feedback,
    });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

router.get("/admin", getFeedback);

export default router;
