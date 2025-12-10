import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "public/uploads/chat_images/";
    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

/**
 * POST /api/conversations/upload
 * Handles image uploads for live chat messages.
 */
router.post("/upload", authenticateToken, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  // Construct the public URL of the uploaded image
  const imageUrl = `/uploads/chat_images/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

export default router;