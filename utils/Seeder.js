import bcrypt from 'bcrypt';
import { Admin } from '../model/user.js';

export default async function seedSuperAdmin() {
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
      region: 'All',
    });

    console.log('Super admin created successfully!');
  } catch (err) {
    console.error('Error creating super admin:', err);
  }
}
