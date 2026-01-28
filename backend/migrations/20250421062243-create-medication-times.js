module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MedicationTimes', {
      medicationTimeId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      medicationRuleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'MedicationRules',
          key: 'medicationRuleId',
        },
        onDelete: 'CASCADE',
      },
      medicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Medications',
          key: 'medicationId',
        },
        onDelete: 'CASCADE',
      },
      medicationStatus: {
        type: Sequelize.ENUM('taken', 'not-taken', 'late'),
        allowNull: false,
        defaultValue: 'not-taken',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'userId',
        },
        onDelete: 'CASCADE',
      },
      reminderTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      mainNotificationId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      followUpNotificationIds: {  
        type: Sequelize.TEXT,    
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MedicationTimes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_MedicationTimes_medicationStatus";');
  },
};
