import Feedback from "../model/feedback.js";

//feedback service func
const getAllFeedbacks = async () => {
  try {
    const feedbacks = await Feedback.findAll({
      order: [["createdAt", "DESC"]],
    });
    return feedbacks;
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    throw error;
  }
};

export default getAllFeedbacks;
