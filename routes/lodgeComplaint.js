import express from "express";
import multer from "multer";
import { UnResolvedQueries } from "../model/complaints.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import { Query } from "../model/queries.js";

const router = express.Router();

// Configure multer (store files in memory for now)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/lodgecomplaint",
  authenticateToken,
  upload.single("photo"), 
  async (req, res) => {
    try {
      const { query_type, description, reference, complaint_status } = req.body;

      if (!query_type || !description || !reference) {
        return res
          .status(400)
          .json({ error: "All required fields must be provided." });
      }

      // Get the latest query from the logged-in citizen
      const recentQuery = await Query.findOne({
        where: { citizen_id: req.user.id },
        order: [["createdAt", "DESC"]],
      });

      // Create new complaint entry
      const newUnresolved = await UnResolvedQueries.create({
        query_type,
        description,
        citizen_id: req.user.id,
        reference,
        complaint_status,
      });

      // Log file info (optional)
      if (req.file) {
        console.log("File received:", req.file.originalname);
        // If you want to store image in DB, you can use req.file.buffer
      }

      return res.status(200).json({ message: "The complaint has been lodged" });
    } catch (error) {
      console.error("Lodge Query Error:", error);
      res.status(500).json({ error: "Failed to lodge a complaint" });
    }
  }
);

export default router;
