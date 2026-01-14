'use strict';

/** @type {import('sequelize-cli').Migration} */

  export async function up (queryInterface, Sequelize) {
    await queryInterface.addColumn('citizen', 'region',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );
  }

  export async function down (queryInterface, Sequelize) {
      await queryInterface.removeColumn('Citizen', 'region', {
        type: Sequelize.STRING,
        allowNull: true
      });
  }

