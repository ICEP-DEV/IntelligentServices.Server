import bcrypt from 'bcrypt';
import { Admin } from '../model/user.js';
import { BOT_USER_ID } from '../config/Gemini.js';

 async function seedSuperAdmin() {
  try {
    const superAdminExists = await Admin.findOne({ where: { isSuperAdmin: true } });
    if (superAdminExists) {
      console.log('Super admin already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.SUPER_PASS, 10);
    await Admin.create({
      email: process.env.SUPER_EMAIL,
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


const ensureBotUserExists = async () => {
  try {
    const botUser = await Admin.findByPk(BOT_USER_ID);
    if (!botUser) {
      console.log("Creating MuniBot user...");
      await Admin.create({
        admin_id: BOT_USER_ID,
        email: "munibot@municipalhub.com",
        password: "unusable_password",
        firstname: "Muni",
        lastname: "Bot",
        region: "Global",
        isSuperAdmin: false,
      });
      console.log("MuniBot user created successfully.");
    }
  } catch (error) {
    console.error("Failed to create or find MuniBot user:", error);
  }
};

export { seedSuperAdmin, ensureBotUserExists }