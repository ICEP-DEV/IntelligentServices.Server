import { Op } from 'sequelize';
import { Query } from '../model/queries.js';

export const autoApproveCitizens = async () => {
  try {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const [updatedCount] = await Query.update(
      { query_status: 'approved' },
      {
        where: {
          query_status: 'resolved',
          createdAt: { [Op.lte]: seventyTwoHoursAgo },
        },
      }
    );

    if (updatedCount > 0) {
      console.log(`${updatedCount} query(s) auto-approved at ${new Date()}`);
    } else {
      console.log(`No pending queries to auto-approve at ${new Date()}`);
    }

    return updatedCount;
  } catch (err) {
    console.error('Error in auto-approve controller:', err);
    throw err;
  }
};
