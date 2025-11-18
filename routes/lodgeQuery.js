import express from 'express';
import multer from 'multer';
import { Query, QueryType, Attachment } from "../model/queries.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import checkSuspended from '../middlewares/checkSuspended.js';

const router = express.Router();

// Middleware for internal service calls
const internalAuth = (req, res, next) => {
  const internalUserId = req.headers['x-internal-user-id'];
  if (internalUserId) {
    req.user = { id: internalUserId };
    return next();
  }
  return authenticateToken(req, res, next);
};

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Lodge a query
router.post('/lodgequery', internalAuth, checkSuspended, upload.single('photo'), async (req, res) => {
  try {
    const { query_type, query_subtype, query_address, query_description ,region,old_status,priority_status,set_priotity_score} = req.body;

    if (!query_type || !query_subtype || !query_address || !query_description || !region) {
      return res.status(400).json({ error: "All fields must be provided" });
    }

    // Handle photo
    let photo_url = null;
    if (req.file) photo_url = req.file.path;

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
      region,
      old_status,
      priority_status,
      set_priotity_score
    });

    const query_id = newQuery.query_id;

    //save photo if it exist
    if (photo_url) await Attachment.create({ photo_url, query_id });

    return res.status(200).json({
      message: "The Query has been lodged",
      query_id,
      status: "submitted",
    });

  } catch (error) {
    console.error("Lodge Query Error:", error);
    res.status(500).json({ error: "Failed to lodge query" });
  }
});

export default router;
