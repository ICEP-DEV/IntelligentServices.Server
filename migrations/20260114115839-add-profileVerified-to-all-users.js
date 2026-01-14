/** @type {import('sequelize-cli').Migration} */

export async function up(queryInterface, Sequelize) {
  const tableNames = ['Admin', 'citizen', 'municipalPersonnel'];

  for (const table of tableNames) {
    // Check if column exists first to prevent "Duplicate column" errors
    const tableDefinition = await queryInterface.describeTable(table);
    
    if (!tableDefinition.profileVerified) {
      await queryInterface.addColumn(table, 'profileVerified', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }
  }
}

export async function down(queryInterface, Sequelize) {
  const tableNames = ['Admin', 'citizen', 'municipalPersonnel'];

  for (const table of tableNames) {
    const tableDefinition = await queryInterface.describeTable(table);
    if (tableDefinition.profileVerified) {
      await queryInterface.removeColumn(table, 'profileVerified');
    }
  }
}