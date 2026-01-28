'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MedicationLogs', {
      medicationLogId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      medicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Medications',
          key: 'medicationId',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', 
          key: 'userId',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      takenAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('taken', 'skipped', 'late'),
        allowNull: false,
        defaultValue: 'taken',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate a delay
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MedicationLogs');
  },
};
