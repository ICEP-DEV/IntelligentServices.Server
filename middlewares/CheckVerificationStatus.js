import { Citizen } from "../model/user.js";


const checkCitizenVerified = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const citizen = await Citizen.findOne({ where: { email } });
    if (!citizen) return next();

    // Only check verification for citizens, allow others to proceed
    if (citizen && !citizen.is_Verified)
      return res.status(403).json({
        error: "Your citizen account is not verified yet. Please verify it to log in.",
      });
    req.citizen = citizen;
    next();
  } catch (error) {
    console.error("Verification Middleware Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export default checkCitizenVerified;
