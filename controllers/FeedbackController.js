import { getAllFeedbacks } from "./FeedbackService";

export const getFeedback = async (req, res) => {
  try {
    const feedbacks = await getAllFeedbacks();
    return res.status(200).json(feedbacks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error fetching feedbacks" });
  }
};