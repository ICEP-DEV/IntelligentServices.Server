// routes/superAdmin.js
import express from "express";
import { Admin, MunicipalPersonnel, Citizen } from "../../model/user.js";
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
      const { name, email, role, region } = req.body;
      
      if (!name || !email || !role || !region) return res.status(400).json({ error: "Missing fields" });
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
          isSuperAdmin: false,
          region: region,
        });
      } else if (role === "municipal") {
        newUser = await MunicipalPersonnel.create({
          firstname: name.split(" ")[0],
          lastname: name.split(" ")[1] || "",
          email,
          password: hashPassword,
          region: region,
        });
      }
      const message = `Your password is ${genPassword}, it is advised to change it when you can`
      await sendEmail(`${role} Confirmation Email`,newUser.email,newUser.firstname,message);
      console.log(message);
      res.status(201).json({
         message: `${role} created successfully`,
          user: {
           firstname: newUser.firstname,
           lastname: newUser.LastName,
           email: newUser.email,
           role,
           region,
        },
        });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get(
  "/users",
  authenticateToken,
  authorizeRole(["superadmin"]),
  async (req, res) => {
    try {
      const admins = await Admin.findAll({
        where: { isSuperAdmin: false },
        attributes: ["admin_id", "firstname", "lastname", "email"],
      });

      const municipals = await MunicipalPersonnel.findAll({
        attributes: ["municipality_id", "firstname", "lastname", "email"],
      });

      const citizens = await Citizen.findAll({
        attributes: ["citizen_id", "firstname", "lastname", "email"],
      });

      const users = [
        ...admins.map(u => ({ id: u.admin_id, firstname: u.firstname, lastname: u.lastname, email: u.email, isSuspended: u.isSuspended, role: "admin" })),
        ...municipals.map(u => ({ id: u.municipality_id, firstname: u.firstname, lastname: u.lastname, email: u.email, isSuspended: u.isSuspended, role: "municipal" })),
        ...citizens.map(u => ({ id: u.citizen_id, firstname: u.firstname, lastname: u.lastname, email: u.email, isSuspended: u.isSuspended, isVerified: u.is_Verified, role: "citizen" })),
      ];


      res.status(200).json({ users });
    } catch (err) {
      console.error("FAILED GET /super/users", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

export default router;