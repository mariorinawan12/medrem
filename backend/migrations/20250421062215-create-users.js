'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dateOfBirth: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.STRING,
        defaultValue: 'main_user',
      },
      parentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'userId',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      // For dependent login
      loginCode: {
        type: Sequelize.STRING(6),
        allowNull: true,
      },
      codeExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      // For password reset
      resetCode: {
        type: Sequelize.STRING(6),
        allowNull: true,
      },
      resetCodeExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      // For FCM token for push notifications
      fcmToken: {
        type: Sequelize.TEXT, // Changed from STRING (VARCHAR 255) to TEXT to support multiple tokens
        allowNull: true,
      },

      // New notification settings
      followUpIntervalMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      followUpCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Optional: Add index for loginCode if you query by it often
    await queryInterface.addIndex('Users', ['loginCode']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Users', ['loginCode']);
    await queryInterface.dropTable('Users');
  },
};
