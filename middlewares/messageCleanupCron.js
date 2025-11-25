import cron from "node-cron";
import { Message } from "../model/message.js";
import { Op } from "sequelize";
import { subDays } from "date-fns";

console.log("Message cleanup cron job initialized.");

cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly message cleanup job...");
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const result = await Message.destroy({
      where: {
        createdAt: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
    });

    console.log(`Message cleanup successful. Deleted ${result} old messages.`);
  } catch (error) {
    console.error("Error during monthly message cleanup:", error);
  }
});