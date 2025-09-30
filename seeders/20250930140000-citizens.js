import fs from 'fs';
const citizens = JSON.parse(fs.readFileSync('citizens.json', 'utf8'));

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert('Citizens', citizens.map(c => ({
    citizen_id: c.citizen_id,
    email: c.email,
    password: c.password,
    firstname: c.firstname,
    lastname: c.lastname,
    locationAddress: c.locationAddress,
    area: c.area,
    createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    deletedAt: c.deletedAt ? new Date(c.deletedAt) : null
  })));
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Citizens', null, {});
}
