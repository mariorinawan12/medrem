module.exports = (sequelize, DataTypes) => {
  const MedicationTime = sequelize.define('MedicationTime', {
    medicationTimeId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    medicationRuleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    medicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    medicationStatus: {
      type: DataTypes.ENUM('taken', 'not-taken','late'),
      allowNull: false,
      defaultValue: 'not-taken',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reminderTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mainNotificationId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    followUpNotificationIds: {  
      type: DataTypes.TEXT,    
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('followUpNotificationIds');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(val) {
        this.setDataValue('followUpNotificationIds', JSON.stringify(val));
      }
    },
  });

  MedicationTime.associate = (models) => {
    MedicationTime.belongsTo(models.MedicationRule, { foreignKey: 'medicationRuleId' });
    MedicationTime.belongsTo(models.Medication, { foreignKey: 'medicationId' });
    MedicationTime.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return MedicationTime;
};
