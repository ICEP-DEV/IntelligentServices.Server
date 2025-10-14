import axios from "axios";
import cosineSimilarity from "cosine-similarity";

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;


async function getEmbedding(text) {
  const res = await axios.post(
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
    { inputs: text },
    {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = Array.isArray(res.data) ? res.data : res.data[0];
  return Array.isArray(data) ? data[0] : data;
}

async function findSimilarReports(newText, reports) {
  
  const allTexts = [newText, ...reports.map(r => r.message)];
  const res = await axios.post(
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
    { inputs: allTexts },
    {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const embeddings = res.data;
  const newEmb = embeddings[0];
  const reportEmbs = embeddings.slice(1);

  const scores = reports.map((r, i) => ({
    message: r.message,
    score: cosineSimilarity(newEmb, reportEmbs[i]),
  }));

  return scores
    .filter(s => s.score > 0.6) 
    .sort((a, b) => b.score - a.score);
}

const reports = [
  { message: "Power outage affecting the whole of Pretoria North" },
  { message: "No water in Sunnyside area" },
  { message: "Entire Pretoria North without electricity" },
  { message: "Community blackout in Pretoria North" },
];

findSimilarReports("The whole of Pretoria North has no power right now", reports)
  .then(similar => console.log(similar))
  .catch(console.error);

export {findSimilarReports, getEmbedding};