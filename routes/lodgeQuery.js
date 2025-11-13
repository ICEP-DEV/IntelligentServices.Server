import express from 'express';
import multer from 'multer';
import { Query, QueryType, Attachment } from "../model/queries.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import checkSuspended from '../middlewares/checkSuspended.js';
import path from 'path';

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Lodge a query
router.post('/lodgequery', authenticateToken, checkSuspended, upload.single('photo'), async (req, res) => {
  try {
    const { query_type, query_subtype, query_address, query_description, region } = req.body;

    if (!query_type || !query_subtype || !query_address || !query_description || !region) {
      return res.status(400).json({ error: "All fields must be provided" });
    }

    // Handle photo safely
    let photo_path = null;
    if (req.file) {
      const filename = path.basename(req.file.filename).replace(/\\/g, '/'); 
      console.log("[UPLOAD SAVED] File path:", filename);
      photo_path = filename;
    }

    // Create or find QueryType
    const [queryTypeRecord] = await QueryType.findOrCreate({
      where: { query_type, query_subtype },
      defaults: { query_type, query_subtype },
    });


    // Create Query
    const newQuery = await Query.create({
      query_description,
      querytype_id: queryTypeRecord.querytype_id,
      query_address,
      citizen_id: req.user.id,
      query_status: "submitted",
      region
    });

 

    const query_id = newQuery.query_id;

    // Save photo if it exists
    if (photo_path) {
      await Attachment.create({
        query_id,
        photo_path
      });
    }

    return res.status(200).json({
      message: "The Query has been lodged",
      query_id,
      status: "submitted",
    });

  } catch (error) {
    console.error("Lodge Query Error:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
