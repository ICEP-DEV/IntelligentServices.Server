// routes/citizen.js
import express from "express";
import { Admin, Citizen, MunicipalPersonnel } from "../model/user.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

router.get("/profile_details", authenticateToken, async (req, res) => {
  try {
    // Assuming your token sets req.user with citizenId
    const citizen = await Citizen.findByPk(req.user.id, {
      attributes: ["firstname", "lastname", "email"]
    });
         if (citizen) {
      return res.json(citizen);
    }
    const technician = await MunicipalPersonnel.findByPk(req.user.id, {
      attributes: ["firstname", "lastname", "email"]
    });
    if (technician) {
      return res.json(technician);
    }

    const admin =  await Admin.findByPk(req.user.id, {
      attributes: ["firstname", "lastname", "email"]
    });
    if (admin){
      return res.json(admin);
    }

  return res.status(404).json({ error: "User not found" });

    res.json(citizen);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch citizen" });
  }
});

export default router;
