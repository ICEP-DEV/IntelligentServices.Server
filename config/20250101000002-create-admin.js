'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('Admin', {
      admin_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isSuperAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      firstname: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastname: {
        type: Sequelize.STRING,
        allowNull: false
      },
      profilePic: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      region: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isSuspended: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      suspendedUntil: {
        type: Sequelize.DATE,
        allowNull: true
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
      }
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Admin');
}