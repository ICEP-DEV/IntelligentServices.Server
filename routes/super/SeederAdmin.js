// routes/superAdmin.js
import express from "express";
import { Admin, MunicipalPersonnel } from "../../models/user.js";
import {authenticateToken} from "../../middlewares/authenticateToken.js";
import { authorizeRole } from "../../middlewares/authorizeRole.js";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import sendEmail from "../../utils/email.js";
import { isEmailTaken } from "../../utils/FindEmail.js";

const router = express.Router();


router.post(
  "/add-user",
  authenticateToken,
  authorizeRole(["superadmin"]),
  async (req, res) => {
    try {
      const { name, email, role } = req.body;
      if (!name || !email || !role) return res.status(400).json({ error: "Missing fields" });

      let superexists = null;
      if (role === "admin") superexists = await Admin.findOne({ where: { email } });
      else if (role === "municipal") superexists = await MunicipalPersonnel.findOne({ where: { email } });
      if (superexists) return res.status(400).json({ error: "User already exists" });

      const exists = await isEmailTaken(email);
      if (exists) {
        return res.status(400).json({ error: "Email already exists" });
      }

      let newUser;
      const genPassword = crypto.randomBytes(8).toString('hex');
      const hashPassword = await bcrypt.hash(genPassword, 10);

      if (role === "admin") {
        newUser = await Admin.create({
          firstname: name.split(" ")[0],
          lastname: name.split(" ")[1] || "",
          email,
          password: hashPassword,
          isSuperAdmin: false
        });
      } else if (role === "municipal") {
        newUser = await MunicipalPersonnel.create({
          firstname: name.split(" ")[0],
          lastname: name.split(" ")[1] || "",
          email,
          password: hashPassword,
          isSuperAdmin: false
        });
      }
      
      const token = jwt.sign(
        { email: newUser.email, role },
        process.env.JWT_SECRET,
        { expiresIn: "25m" }
      );
      const message = `Your password is ${genPassword}, it is advised to change it when you can`
      await sendEmail("Admin Confirmation Email",newUser.email,token,newUser.firstname,message);
      
      res.status(201).json({
         message: `${role} created successfully`,
          user: {
           firstname: newUser.firstname,
           lastname: newUser.LastName,
           email: newUser.email,
           role,
        },
        });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/users",
    authenticateToken,
    authorizeRole(["superadmin"]),
    
    async (req,res) => {
      try{
        const admins = await Admin.findAll({
          where: {isSuperAdmin: false},
          attributes: ["admin_id","firstname","lastname","email"],
        });
        const municipals = await MunicipalPersonnel.findAll({
          attributes: ["municipality_id","firstname","lastname","email"],
        });

        const users = [
          ...admins.map(u => ({...u.dataValues, role: "admin"})),
          ...municipals.map(u => ({...u.dataValues,role: "municipals"})),
        ];

        

        res.status(200).json({users});
      } catch (err) {
        console.error("FAILED GET super/USERS",err);
        res.status(500).json({ error: "failed to fetch users"})
      }
    }
)

export default router;
