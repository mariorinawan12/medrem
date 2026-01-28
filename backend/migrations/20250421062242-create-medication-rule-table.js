module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MedicationRules', {
      medicationRuleId: {
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
      },
      ruleTime: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dayTime: {
        type: Sequelize.STRING, 
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
    await queryInterface.dropTable('MedicationRules');
  },
};
