module.exports = (sequelize, DataTypes) => {
  const Medication = sequelize.define('Medication', {
    medicationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    dosage: DataTypes.INTEGER,
    stockQuantity: DataTypes.INTEGER,
    medicationType: DataTypes.ENUM('medication', 'vitamin'),
    medicationForm: DataTypes.ENUM('pills', 'mg', 'ml', 'drops', 'inhaler'),
    userId: DataTypes.INTEGER,
  });

 

  Medication.associate = (models) => {
    Medication.belongsTo(models.User, { foreignKey: 'userId' });
    Medication.hasMany(models.MedicationTime, { foreignKey: 'medicationId' });
    Medication.hasMany(models.MedicationLog, { foreignKey: 'medicationId' });
  };

  Medication.removeAttribute('id');
  return Medication;
};
