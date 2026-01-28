module.exports = (sequelize, DataTypes) => {
  const MedicationLog = sequelize.define('MedicationLog', {
    medicationLogId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    medicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    takenAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('taken', 'skipped', 'late'),
      defaultValue: 'taken',
    },
  });

  MedicationLog.associate = (models) => {
    MedicationLog.belongsTo(models.Medication, {
      foreignKey: 'medicationId',
    });
    MedicationLog.belongsTo(models.User, {
      foreignKey: 'userId',
    });
  };

  MedicationLog.removeAttribute('id');
  return MedicationLog;
};
