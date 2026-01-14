import { Router } from 'express';
import { generateProfileChangeOTP, verifyOTPAndLogin, verifyProfileChangeOTP } from '../controllers/VerificationController.js';
import authenticateToken from '../middlewares/authenticateToken.js';

const router = Router();

router.post('/verify-otp', verifyOTPAndLogin);
router.patch('/profile-otp',authenticateToken, generateProfileChangeOTP)
router.post('/verify-profile-otp',authenticateToken, verifyProfileChangeOTP)


export default router;
