import express from "express";
import { getSocket } from "../config/socket.js";
import Feedback from "../model/feedback.js";
import { Citizen } from "../model/user.js";

const router = express.Router();

// Citizen feedback submission
router.post("/citizen/feedback", async (req, res) => {
  try {
    const { citizen_id, message, rating } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const feedback = await Feedback.create({
      message,
      rating,
      citizen_id,
    });

    // Optional real-time socket event
    const io = getSocket();
    io.emit("newFeedback", feedback);

    res.status(201).json({
      success: true,
      feedback,
    });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

router.get("/admin/feedback", async (req, res) => {
  try {
    const citizenFeedback = await Feedback.findAll({
      attributes: ["message", "rating"],
      include: [
        {
          model: Citizen,
          attributes: ["email", "firstname", "lastname"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ data: citizenFeedback });
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

export default router;
