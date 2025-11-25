// routes/citizen.js
import express from "express";
import { Citizen } from "../model/user.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

router.get("/citizen_details", authenticateToken, async (req, res) => {
  try {
    // Assuming your token sets req.user with citizenId
    const citizen = await Citizen.findByPk(req.user.id, {
      attributes: ["firstname", "lastname", "email"]
    });

    if (!citizen) return res.status(404).json({ error: "Citizen not found" });

    res.json(citizen);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch citizen" });
  }
});

export default router;
