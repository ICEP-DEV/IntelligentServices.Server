import Feedback from "../model/feedback";

//feedback service func
export const getAllFeedbacks = async () => {
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