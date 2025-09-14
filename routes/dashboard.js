import express from 'express';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';

const router = express.Router();

router.get('/citizen', authenticateToken, authorizeRole(['citizen']), (req, res) => {
  res.json({ message: `Welcome Citizen ${req.user.email}` });
});

router.get('/admin', authenticateToken, authorizeRole(['admin']), (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.email}` });
});

router.get('/municipal', authenticateToken, authorizeRole(['municipal']), (req, res) => {
  res.json({ message: `Welcome Municipal Personnel ${req.user.email}` });
});

export default router;
