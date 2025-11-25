import express from "express";
import { getSocket } from "../config/socket.js";
import Feedback from "../model/feedback.js";
import { Citizen } from "../model/user.js";
import authenticateToken from "../middlewares/authenticateToken.js";
import checkSuspended from "../middlewares/checkSuspended.js";

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
    io.to("admin-role").emit("newFeedback",  {
      citizen_id,
      name: `${citizen.firstname} ${citizen.lastname}`,
      message,
      rating,
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

router.get("/admin", async (req, res) => {
  try {
    const citizenFeedback = await Feedback.findAll({
      attributes: ["message", "rating","createdAt"],
      include: [
        {
          model: Citizen,
          attributes: ["firstname", "lastname"],
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
