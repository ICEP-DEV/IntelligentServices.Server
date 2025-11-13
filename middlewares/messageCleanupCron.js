import cron from 'node-cron';
import { Message } from '../model/message.js';
import { Op } from 'sequelize';

// Runs daily at 03:00 to remove messages older than 30 days
cron.schedule('0 3 * * *', async () => {
  console.log('⚡ Cron job started: Cleaning up old messages...');
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    const deleted = await Message.destroy({
      where: {
        createdAt: { [Op.lt]: cutoff }
      }
    });
    console.log(`Message cleanup finished. Deleted ${deleted} messages older than ${cutoff.toISOString()}`);
  } catch (error) {
    console.error('Message cleanup error:', error);
  }
});
