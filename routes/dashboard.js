import express from 'express';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';
import checkSuspended from '../middlewares/checkSuspended.js';

const router = express.Router();

router.get('/citizen', authenticateToken,checkSuspended, authorizeRole(['citizen']), (req, res) => {
  res.json({ message: `Welcome Citizen ${req.user.email}` });
});

router.get('/admin', authenticateToken, checkSuspended, authorizeRole(['admin']), (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.email}` });
});

router.get('/municipal', authenticateToken,checkSuspended, authorizeRole(['municipal']), (req, res) => {
  res.json({ message: `Welcome Municipal Personnel ${req.user.email}` });
});

router.get('/auth/check', authenticateToken, checkSuspended, (req, res) => {
  res.json({ user: req.user });
});

export default router;
