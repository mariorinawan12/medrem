'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Medications', {
      medicationId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dosage: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stockQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      medicationType: {
        type: Sequelize.ENUM('medication', 'vitamin'),
        allowNull: false,
      },
      medicationForm: {
        type: Sequelize.ENUM('pills', 'mg', 'ml', 'drops', 'inhaler'),
        allowNull: false,
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop enums first to prevent constraint issues
    await queryInterface.dropTable('Medications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Medications_medicationType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Medications_medicationForm";');
  },
};
