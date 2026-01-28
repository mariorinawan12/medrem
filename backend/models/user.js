module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'main_user',
    },
    parentId: {
      type: DataTypes.INTEGER,
    },


    loginCode: {
      type: DataTypes.STRING(6),
    },
    codeExpiresAt: {
      type: DataTypes.DATE,
    },

    resetCode: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    resetCodeExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

   
    fcmToken: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },

 
    followUpIntervalMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,  
    },
    followUpCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,  
    },
  });

  User.associate = (models) => {
    User.hasMany(models.Medication, { foreignKey: 'userId' });
    User.hasMany(models.MedicationTime, { foreignKey: 'userId' });
  };

  User.removeAttribute('id');
  return User;
};
