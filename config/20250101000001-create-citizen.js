'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('citizen', {
      citizen_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(36)
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      locationAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      area: {
        type: Sequelize.STRING,
        allowNull: true
      },
      region: {
        type: Sequelize.STRING,
        allowNull: true
      },
      firstname: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastname: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profilePic: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },
      isSuspended: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      suspendedUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_Verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      profileVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('citizen');
}