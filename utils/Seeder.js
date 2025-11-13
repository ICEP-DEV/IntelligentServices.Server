import bcrypt from 'bcrypt';
import { Admin } from '../model/user.js';
import { BOT_USER_ID } from '../config/Gemini.js';

export async function seedSuperAdmin() {
  try {
    const superAdminExists = await Admin.findOne({ where: { isSuperAdmin: true } });
    if (superAdminExists) {
      console.log('Super admin already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.SUPER_PASS || 'superpass', 10);
    await Admin.create({
      email: process.env.SUPER_EMAIL || 'superadmin@example.com',
      password: hashedPassword,
      isSuperAdmin: true,
      firstname: 'System',
      lastname: 'Admin',
    region: 'Global',
    });

    console.log('Super admin created successfully!');
  } catch (err) {
    console.error('Error creating super admin:', err);
  }
}
export async function ensureBotUserExists() {
  try {
    // Try to find the bot by its fixed admin ID first
    let botUser = null;
    if (typeof BOT_USER_ID !== 'undefined') {
      botUser = await Admin.findByPk(BOT_USER_ID);
    }

    if (!botUser) {
      console.log('Creating MuniBot admin user...');
      const hashed = await bcrypt.hash(process.env.BOT_PASS || 'unusable_password', 10);
      botUser = await Admin.create({
        admin_id: BOT_USER_ID,
        email: process.env.BOT_EMAIL || 'munibot@municipalhub.com',
        password: hashed,
        firstname: 'Muni',
        lastname: 'Bot',
        region: process.env.BOT_REGION || 'Global',
        isSuperAdmin: false,
      });
      console.log('MuniBot admin user created successfully.');
    } else {
      console.log('MuniBot admin user already exists.');
    }
  } catch (error) {
    console.error('Failed to create or find MuniBot user:', error);
  }
}

export default seedSuperAdmin;

