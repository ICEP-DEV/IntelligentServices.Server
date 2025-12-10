import express from 'express';
import * as noticeController from '../../controllers/noticeController.js';
import authenticateToken from '../../middlewares/authenticateToken.js';
import { authorizeRole } from '../../middlewares/authorizeRole.js';
import multer from 'multer';

const router = express.Router();

// Configure multer to store files in memory as buffers.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/notices', noticeController.getNotices);
router.get('/notices/image/:id', noticeController.getImageNoticeById);


// --- Super Admin Routes ---

// POST /api/super/notices/update - Secure endpoint for updating all notices.
router.post(
  '/notices/update', // The full path will be /super/notices/update
  [authenticateToken, authorizeRole(["superadmin"])],
  upload.array('images', 10), // Handles up to 10 image uploads at once.
  noticeController.updateNotices
);

export default router;