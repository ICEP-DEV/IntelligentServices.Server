import express from 'express';
import { Citizen, Admin, MunicipalPersonnel } from '../model/user.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import { generateProfileChangeOTP } from '../controllers/VerificationController.js';

const router = express.Router();

router.get("/user/profile", authenticateToken, async (req, res) => {
  const { id, role } = req.user;
  let user;

  if (role === "citizen") user = await Citizen.findByPk(id);
  if (role === "admin") user = await Admin.findByPk(id);
  if (role === "municipal") user = await MunicipalPersonnel.findByPk(id);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.put("/user/update", authenticateToken, generateProfileChangeOTP);

export default router;