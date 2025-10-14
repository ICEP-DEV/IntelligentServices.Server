import { findSimilarReports,getEmbedding } from "../config/LLMconfig.js";
import express from "express";

const router = express.Router();

router.post("/citizen/report", async (req, res) => {
  try {
    const { message, reports } = req.body;
    const similar = await findSimilarReports(message, reports);
    res.status(200).json({ similar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;