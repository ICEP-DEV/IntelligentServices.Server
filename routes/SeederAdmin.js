// routes/superAdmin.js
import express from "express";
import { Admin, MunicipalPersonnel } from "../models/user.js";
import {authenticateToken} from "../middlewares/authenticateToken.js";
import { authorizeRole } from "../middlewares/authorizeRole.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "./reset.js";

const router = express.Router();

router.post(
  "/add-user",
  authenticateToken,
  authorizeRole(["superadmin"]),
  async (req, res) => {
    try {
      const { name, email, role } = req.body;
      if (!name || !email || !role) return res.status(400).json({ error: "Missing fields" });

      let exists = null;
      if (role === "admin") exists = await Admin.findOne({ where: { email } });
      else if (role === "municipal") exists = await MunicipalPersonnel.findOne({ where: { email } });
      if (exists) return res.status(400).json({ error: "User already exists" });

      let newUser;
      if (role === "admin") {
        newUser = await Admin.create({
          firstname: name.split(" ")[0],
          lastname: name.split(" ")[1] || "",
          email,
          isSuperAdmin: false
        });
      } else if (role === "municipal") {
        newUser = await MunicipalPersonnel.create({
          firstname: name.split(" ")[0],
          lastname: name.split(" ")[1] || "",
          email
        });
      }

      const token = jwt.sign(
        { email: newUser.email, role },
        process.env.JWT_SECRET,
        { expiresIn: "25m" }
      );

      await sendEmail(email, token, newUser.firstname);

      res.status(201).json({ message: `${role} created successfully`, user: newUser });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
