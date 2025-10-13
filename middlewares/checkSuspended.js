import { Admin, MunicipalPersonnel, Citizen } from "../model/user.js";

export default async function checkSuspended(req, res, next) {
  try {
    const userId = req.user.id;
    let user =
      (await Admin.findByPk(userId)) ||
      (await MunicipalPersonnel.findByPk(userId)) ||
      (await Citizen.findByPk(userId));

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isSuspended)
      return res
        .status(403)
        .json({ message: "Account suspended. Contact support." });

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to verify user suspension" });
  }
}
