import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';
import { Query } from "../model/queries.js";
import { MunicipalPersonnel } from '../model/user.js';
import Notification from '../model/notifications.js';
import { getSocket } from '../config/socket.js';
import checkSuspended from '../middlewares/checkSuspended.js';

const router = express.Router();

router.post(
  "/assign-technician",
  authenticateToken,
  authorizeRole(["admin"]),
  checkSuspended,
  async (req, res) => {
    try {
      const { query_id } = req.body;

      if (!query_id) {
        return res.status(400).json({ error: "Query ID is required" });
      }

      const query = await Query.findByPk(query_id);
      if (!query) {
        return res.status(404).json({ error: "Query not found" });
      }

      const technicians = await MunicipalPersonnel.findAll({
        where: { region: query.region }
      });

      if (!technicians.length) {
        return res.status(404).json({ error: "No technicians found in this region" });
      }

      // await query.addMunicipalPersonnels(technicians);
      await query.addMunicipalPersonnels(technicians);
      query.query_status = "assigned";
      await query.save();

      // --- Notification Logic ---
      const io = getSocket();
      const notificationMessage = `You have been assigned a new query: #${query.query_id}`;
      const notificationPromises = technicians.map(async (technician) => {
        const notification = await Notification.create({
          type: 'New Assignment',
          message: notificationMessage,
        });
        await notification.addMunicipalPersonnel(technician);
        io.to(`user:${technician.municipality_id}`).emit('newAssignment', query);
      });

      await Promise.all(notificationPromises);

      res.status(200).json({
        message: `Query ${query.query_id} assigned to all technicians in region ${query.region}`
      });

    } catch (error) {
      console.error("Assign Technician Error:", error);
      res.status(500).json({ error: "Failed to assign technician" });
    }
  }
);

export default router;
