import express from "express";
import { AdminReport } from "../model/reports.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

router.post('/admin_report', authenticateToken, async (req, res) => {
    try {
        const { date , queries , complaints , false_queries , urgent_queries } = req.body;

        if (!date || !queries || !complaints || !false_queries || !urgent_queries) {
            return res.status(400).json({ error: "All fields must be provided" });
        }
        // Create Report
        const newReport = await AdminReport.create({
            date,
            queries,
            complaints,
            false_queries,
            urgent_queries,
            generated_by: req.user.id
        });
        res.status(201).json({ message: "Report generated successfully", report: newReport });
    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({ error: "Failed to generate report" });
    }
}
);
export default router;