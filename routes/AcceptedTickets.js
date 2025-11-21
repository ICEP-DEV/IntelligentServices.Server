import express from "express";
import { Op } from "sequelize";
import { Query } from "../model/queries.js";
import { MunicipalPersonnel } from "../model/user.js";
import authenticateToken from "../middlewares/authenticateToken.js";

const router = express.Router();

router.post("/accept-query/:ticketId", authenticateToken, async (req, res) => {
  const { ticketId } = req.params;
  const technicianId = req.user.id; // Extracted from token by middleware

  try {
    const technician = await MunicipalPersonnel.findByPk(technicianId);
    const query = await Query.findByPk(ticketId);

    if (!query) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    const isAssigned = await query.hasMunicipalPersonnel(technician);

    if (!isAssigned) {
      return res.status(404).json({ error: "Ticket not found or not assigned to you." });
    }

    // Update the query status to 'accepted'
    query.query_status = 'accepted';
    query.isAssigned = true; // Mark the query as taken
    query.municipality_id = technicianId; // Assign the query to the accepting technician
    await query.save();

    res.status(200).json({ message: "Ticket accepted successfully!" });
  } catch (error) {
    console.error("Error accepting ticket:", error);
    res.status(500).json({ error: "Server error while accepting the ticket." });
  }
});

router.get("/assigned-queries-accepted", authenticateToken, async (req, res) => {
  const technicianId = req.user.id;

  try {
    // Fetch queries accepted by this technician with active statuses
    const acceptedQueries = await Query.findAll({
      where: {
        municipality_id: technicianId,
        query_status: {
          [Op.in]: ['accepted', 'onsite', 'in progress', 'resolved']
        }
      }
    });
    res.status(200).json({ acceptedQueries });
  } catch (error) {
    console.error("Error fetching accepted tickets:", error);
    res.status(500).json({ error: "Server error while fetching accepted tickets." });
  }
});

router.put("/update-ticket-status/:ticketId", authenticateToken, async (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body;
  const technicianId = req.user.id;

  if (!status) {
    return res.status(400).json({ error: "New status is required." });
  }

  // Normalize status to match database values if needed (e.g., 'ONSITE' -> 'onsite')
  const normalizedStatus = status.toLowerCase();

  try {
    const query = await Query.findByPk(ticketId);
    if (!query) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    const technician = await MunicipalPersonnel.findByPk(technicianId);
    const isAssigned = await query.hasMunicipalPersonnel(technician);

    if (!isAssigned) {
      return res.status(404).json({ error: "Ticket not found or you are not authorized to update it." });
    }

    query.query_status = normalizedStatus;
    await query.save();

    res.status(200).json({ message: "Ticket status updated successfully!" });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({ error: "Server error while updating ticket status." });
  }
});

export default router;
