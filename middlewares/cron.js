import cron from "node-cron";
import { UpdatePriorityScores } from "../utils/PriorityMapper.js";

cron.schedule("* */16 * * *", async () => {
  console.log("⚡ Cron job started: Updating priority scores...");

  try {
    await UpdatePriorityScores();
    console.log("Priority scores updated successfully");
  } catch (error) {
    console.error("Error updating priority scores:", error);
  }
});
