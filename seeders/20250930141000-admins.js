import fs from 'fs';
const admins = JSON.parse(fs.readFileSync('admins.json', 'utf8'));

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert('Admins', admins.map(a => ({
    admin_id: a.admin_id,
    email: a.email,
    password: a.password,
    isSuperAdmin: false,
    firstname: a.firstname,
    lastname: a.lastname,
    createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
    updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date()
  })));
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Admins', null, {});
}
