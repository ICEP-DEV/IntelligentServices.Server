import { Query } from "../model/queries.js";
import { Citizen } from "../model/user.js";
import { Op } from "sequelize";

export async function UpdatePriorityScores() {
  console.log("Running Priority score mapper...");

  const queries = await Query.findAll({
    where: {
      priority_status: { [Op.not]: "high" },
      set_priotity_score: { [Op.lt]: 100 },
      query_status: { [Op.ne]: "completed" },
    },
    include: [{ model: Citizen, attributes: ["area"] }],
  });

  for (const q of queries) {
    let increment = 5;
    let currStatus = q.priority_status;
    let currScore = q.set_priotity_score;
    let newStatus = currStatus;
    let newScore = currScore + increment;

    if (currStatus === "low") {
      if (newScore >= 50) {
        newStatus = "medium";
        if (newScore >= 80) newScore = 79;
      }
    } else if (currStatus === "medium") {
      if (newScore >= 80) {
        newStatus = "high";
        if (newScore >= 100) newScore = 99;
      }
    }

    if (newStatus === currStatus && newScore === currScore) continue;

    q.set_priotity_score = Math.min(newScore, 99);
    q.priority_status = newStatus;

    console.log(
      `Query ${q.query_id}: ${currStatus} (${currScore}) → ${newStatus} (${q.set_priotity_score})`
    );
    await q.save();
  }
}
