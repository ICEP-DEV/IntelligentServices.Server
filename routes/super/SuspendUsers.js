import express from "express";
import { Admin, MunicipalPersonnel, Citizen } from "../../model/user.js";
import sendEmail from "../../utils/email.js";

const router = express.Router();

router.patch("/users/:id/suspend", async (req, res) => {
  const { id } = req.params;

  try {
    let user = await Admin.findByPk(id);
    let userType = "admin";

    if (!user) {
      user = await MunicipalPersonnel.findByPk(id);
      userType = "municipal";
    }

    if (!user) {
      user = await Citizen.findByPk(id);
      userType = "citizen";
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isSuspended = !user.isSuspended;
    await user.save();

    // Send email if the user is suspended
    if (user.isSuspended) {
      await sendEmail(
        "Account Suspended",
        user.email,
        null, // token not needed for suspension
        user.name || user.username || "User",
        `Your account has been suspended. Please contact support if you believe this is an error.`
      );
    }

    return res.json({
      message: `${userType} user ${user.isSuspended ? "suspended" : "activated"}`,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update user suspension" });
  }
});

export default router;