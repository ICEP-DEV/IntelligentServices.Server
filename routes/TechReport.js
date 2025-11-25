import express from 'express'
import { TechnicianReport } from '../model/reports.js';
const router = express.Router();


router.post("/technician_reports", async (req, res) => {
  try {
    const { Date, "Query Name/ID": queryName, "Work summary": workSummary, "Issues faced": issuesFaced, "Hours worked": hoursWorked, Recommendations: recommendations } = req.body;

    if (!Date || !queryName || !workSummary || !issuesFaced || !hoursWorked || !recommendations) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newReport = await TechnicianReport.create({
      date: Date,
      queryName,
      workSummary,
      issuesFaced,
      hoursWorked,
      recommendations
    });

    res.status(201).json({ message: "Report saved successfully", report: newReport });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ error: "Failed to save report" });
  }
});

export default router;
