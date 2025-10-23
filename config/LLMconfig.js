import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY; // or HF_TOKEN if that’s what you named it

export async function findSimilarReports(newText, reports) {
  try {
    // Extract all report messages
    const sentences = reports.map((r) => r.message);

    // Call Hugging Face's sentence similarity pipeline
    const res = await axios.post(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/sentence-similarity",
      {
        inputs: {
          source_sentence: newText,
          sentences,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const scores = res.data; // returns an array of similarity scores (0–1)

    // Combine the text + score into one array and filter strong matches
    const results = sentences
      .map((text, i) => ({ message: text, score: scores[i] }))
      .filter((r) => r.score > 0.6)
      .sort((a, b) => b.score - a.score);

    return results;
  } catch (err) {
    console.error("Similarity comparison failed:", err.response?.data || err.message);
    return [];
  }
}
