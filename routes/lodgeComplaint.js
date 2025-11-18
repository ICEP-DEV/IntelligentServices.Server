import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UnResolvedQueries, ComplaintAttachments } from "../model/complaints.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import { Query } from "../model/queries.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

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

      // Get the latest query from the logged-in user
      const recentQuery = await Query.findOne({
        where: { citizen_id: req.user.id },
        order: [["createdAt", "DESC"]],
      });

      // get region from recent query to make compaint region based
    const query = await Query.findByPk(reference); 
  
      // Create a new complaint
      const newComplaint = await UnResolvedQueries.create({
        query_type,
        description,
        citizen_id: req.user.id,
        reference,
        complaint_status,
        region : query.region,
        query_id: query.query_id,

      });

      console.log("New Complaint Created:", newComplaint);
      console.log("Region from Query:", query.region);

      // Handle uploaded file (if provided)
      if (req.file) {
        const photo_path = req.file.filename;
        console.log("[UPLOAD SAVED] File path:", photo_path);

        await ComplaintAttachments.create({
          complaint_id: newComplaint.id,
          photo_path,
        });
      }

      return res
        .status(200)
        .json({ message: "The complaint has been lodged successfully." });
    } catch (error) {
      console.error("Lodge Complaint Error:", error);
      res.status(500).json({ error: "Failed to lodge a complaint." });
    }
  }
);

export default router;
