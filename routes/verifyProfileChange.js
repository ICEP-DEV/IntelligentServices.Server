import { Router } from 'express';
import { verifyProfileChangeOTP } from '../controllers/VerificationController.js';
import authenticateToken from '../middlewares/authenticateToken.js';

const router = Router();

router.post('/verify-profile-change', authenticateToken, verifyProfileChangeOTP);

export default router;