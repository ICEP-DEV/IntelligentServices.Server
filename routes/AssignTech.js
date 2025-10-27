import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import { authorizeRole } from '../middlewares/authorizeRole.js';
import { Query } from "../model/queries.js";
import { MunicipalPersonnel } from '../model/user.js';

const router = express.Router();

router.post(
  "/assign-technician",
  authenticateToken,
  authorizeRole(["admin"]),
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

      await query.addMunicipalPersonnels(technicians);
      query.query_status = "assigned";
      await query.save();

      res.json({
        message: `Query ${query.query_id} assigned to all technicians in region ${query.region}`
      });

    } catch (error) {
      console.error("Assign Technician Error:", error);
      res.status(500).json({ error: "Failed to assign technician" });
    }
  }
);

export default router;
