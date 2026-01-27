import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Citizen, Admin, MunicipalPersonnel } from '../model/user.js';
import checkCitizenVerified from '../middlewares/CheckVerificationStatus.js';

import { checkLoginBlock,resetLoginAttempts,trackFailedLogin } from '../middlewares/loginLimiter.js';

const router = express.Router();

// LOGIN
router.post('/login',checkCitizenVerified,checkLoginBlock, async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = null;
    let role = null;

    const [citizen, admin, municipal] = await Promise.all([
      Citizen.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
      MunicipalPersonnel.findOne({ where: { email } }),
    ]);

    if (citizen) {
      user = citizen;
      role = "citizen";
    } else if (admin) {
      user = admin;
      role = admin.isSuperAdmin ? "superadmin" : "admin";
    } else if (municipal) {
      user = municipal;
      role = "municipal";
    }

    if (!user) {

      const status = await trackFailedLogin(req.ip);
      if(status.blocked){
        return res.status(429).json({ error: "Too many attempts. Blocked for 5 minutes." });
      }

      return res.status(401).json({ 
        error: "Invalid Credentials",
        remaining: status.remaining, //remaining attempts
      });
    }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        const status = await trackFailedLogin(req.ip);

        if(status.blocked){
          return res.status(429).json({ error: "Too many attempts. Blocked for 5 minutes." });
        
        }  
        return res.status(401).json({ 
          error: "Invalid email or password",
          remaining: status.remaining, //remaining attempts
         });
        }
    
    if (user.status && user.status.toLowerCase() === "suspended") {
      return res.status(403).json({ error: "Account suspended. Contact support." });
    }

    // Determine user ID field dynamically
    const userId = user.citizen_id || user.admin_id || user.municipality_id;

    const token = jwt.sign(
      //added isSuspended
      { id: userId, role, region: user.region,firstname: user.firstname,lastname: user.lastname, email, isSuspended: user.isSuspended },
      process.env.JWT_SECRET,
      { expiresIn: "5h" } 
    );
    if(!token) return res.status(403).json({ error: "Token Invalid or Token Expired"})

    //if successful, reset attempts
    await resetLoginAttempts(req.ip);

    res.status(200).json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
