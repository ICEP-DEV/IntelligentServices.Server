import { autoApproveCitizens } from "../controllers/AutoApprove.js";
import cron from "node-cron";

console.log("update approve status job started");

cron.schedule('0 * * * *', async () => {
  await autoApproveCitizens();
});