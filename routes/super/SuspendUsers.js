import express from "express";
import { Admin, MunicipalPersonnel,Citizen } from "../../models/user.js";
import sendEmail from "../../utils/email.js";

const router = express.Router();

router.patch("users/:id/suspend", async (req ,res) => {
    const {id} = req.params;

    try {
        let user = await Admin.FindByPk(id);
        let userType = "admin";

        if(!user){
            let user = await MunicipalPersonnel.FindByPk(id);
            let userType = "municipal";
        }
        if(!user){
            let user = await Citizen.FindByPk(id);
            let userType = "citizen";
        }
        
        if (!user) return res.status(404).json({ message: "User not found" });
        
        user.isSuspended = !user.isSuspended;
        await user.save();

        return res.json({ message: `${userType} user ${user.isSuspended ? "suspended" : "activated"}`, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update user suspension" });
    }
})