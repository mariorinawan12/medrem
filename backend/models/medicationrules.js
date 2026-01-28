module.exports = (sequelize, DataTypes) => {
  const MedicationRule = sequelize.define('MedicationRule', {
    medicationRuleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    medicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ruleTime: {
      type: DataTypes.STRING, // Time in HH:mm:ss format
      allowNull: false,
    },
    dayTime: {
      type: DataTypes.STRING, // A string like 'monday', 'tuesday', etc.
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  MedicationRule.associate = (models) => {
    MedicationRule.belongsTo(models.Medication, { foreignKey: 'medicationId' });
    MedicationRule.belongsTo(models.User, { foreignKey: 'userId' });
    MedicationRule.hasMany(models.MedicationTime, { foreignKey: 'medicationRuleId' });
  };

  return MedicationRule;
};
