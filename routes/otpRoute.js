import { Router } from 'express';
import { verifyOTPAndLogin } from '../controllers/VerificationController.js';

const router = Router();

router.post('/verify-otp', verifyOTPAndLogin);

export default router;
