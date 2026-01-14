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
      const { name, email, role, region,supervisor } = req.body;
      
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
          isSupervisor: supervisor,
        });
      }
      const message = `Your password is ${genPassword}, it is advised to change it when you can`
      await sendEmail(`${role} Confirmation Email`,newUser.email,newUser.firstname,message);
      console.log(message);
      res.status(201).json({
         message: `${role} created successfully`,
          user: {
           firstname: newUser.firstname,
           lastname: newUser.lastName,
           email: newUser.email,
           role,
           region,
        },
        });
      console.log(`[SUPERADMIN] Created new ${role}:`, newUser.email);
      console.log(`Temporary password for ${newUser.email}: ${genPassword}`);
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
        attributes: ["admin_id", "firstname", "lastname", "email","isSuspended","region"],
      });

      const municipals = await MunicipalPersonnel.findAll({
        attributes: ["municipality_id", "firstname", "lastname", "email","isSuspended","region","isSupervisor"],
      });

      const citizens = await Citizen.findAll({
        attributes: ["citizen_id", "firstname", "lastname", "email","isSuspended"],
      });

      const users = [
        ...admins.map(u => ({ userId: u.admin_id, firstname: u.firstname, lastname: u.lastname, email: u.email, isSuspended: u.isSuspended,region: u.region, role: "admin" })),
        ...municipals.map(u => ({ userId: u.municipality_id, firstname: u.firstname, lastname: u.lastname, email: u.email, isSuspended: u.isSuspended,region: u.region, role: u.isSupervisor ? "supervisor" : "technician", region: u.region  })),
        ...citizens.map(u => ({ userId: u.citizen_id, firstname: u.firstname, lastname: u.lastname, email: u.email, isSuspended: u.isSuspended, isVerified: u.is_Verified, role: "citizen",region: "N/A"})),
      ];

     

      res.status(200).json({ users });
    } catch (err) {
      console.error("FAILED GET /super/users", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

router.post(
  "/bulk-add-users",
  authenticateToken,
  authorizeRole(["superadmin"]),
  async (req, res) => {
    const { users } = req.body; 

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "Invalid or empty user list" });
    }

    const CHUNK_SIZE = 50;
    const results = { success: 0, errors: [] };

    try {
      for (let i = 0; i < users.length; i += CHUNK_SIZE) {
        const chunk = users.slice(i, i + CHUNK_SIZE);
        const processedChunk = await Promise.all(
          chunk.map(async (u) => {
            const genPassword = crypto.randomBytes(8).toString("hex");
            const hashPassword = await bcrypt.hash(genPassword, 10);
            
            return {
              ...u,
              genPassword,
              hashPassword,
              firstname: u.name.split(" ")[0],
              lastname: u.name.split(" ")[1] || "",
            };
          })
        );
        const admins = processedChunk.filter(u => u.role === "admin");
        const municipals = processedChunk.filter(u => u.role === "municipal");

        if (admins.length > 0) {
          await Admin.bulkCreate(admins.map(a => ({
            firstname: a.firstname,
            lastname: a.lastname,
            email: a.email,
            password: a.hashPassword,
            isSuperAdmin: false,
            region: a.region
          })));
        }

        if (municipals.length > 0) {
          await MunicipalPersonnel.bulkCreate(municipals.map(m => ({
            firstname: m.firstname,
            lastname: m.lastname,
            email: m.email,
            password: m.hashPassword,
            region: m.region,
            isSupervisor: m.supervisor || false
          })));
        }
        for (const user of processedChunk) {
          const message = `Your password is ${user.genPassword}`;
          await sendEmail(`${user.role} Confirmation`, user.email, user.firstname, message);
          results.success++;
        }
      }

      res.status(201).json({ 
        message: "Bulk creation complete", 
        processed: results.success 
      });

    } catch (err) {
      console.error("Bulk Create Error:", err);
      res.status(500).json({ error: "Server error during bulk creation" });
    }
  }
);

export default router;