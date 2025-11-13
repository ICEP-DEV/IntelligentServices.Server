import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Citizen, Admin, MunicipalPersonnel } from '../model/user.js';
import { isEmailTaken } from '../utils/FindEmail.js';
import checkSuspended from '../middlewares/checkSuspended.js';

const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = null;
    let role = null;

    

    user = await Citizen.findOne({ where: { email } });
    if (user) role = "citizen";

    if (!user) {
      user = await Admin.findOne({ where: { email } });
      if (user) {
        role = user.isSuperAdmin ? "superadmin" : "admin";
      }
    }

    if (!user) {
      user = await MunicipalPersonnel.findOne({ where: { email } });
      if (user) role = "municipal";
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
        }
    
    if (user.status && user.status.toLowerCase() === "suspended") {
      return res.status(403).json({ error: "Account suspended. Contact support." });
    }

    // Determine user ID field dynamically
    const userId = user.citizen_id || user.admin_id || user.municipality_id;

    const token = jwt.sign(
      { id: userId, role, region: user.region },
      process.env.JWT_SECRET,
      { expiresIn: "5h" } 
    );
    if(!token) return res.status(403).json({ error: "Token Invalid or Token Expired"})

    

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: userId,
        email: user.email,
        role,
        region: user.region || "N/A"
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
