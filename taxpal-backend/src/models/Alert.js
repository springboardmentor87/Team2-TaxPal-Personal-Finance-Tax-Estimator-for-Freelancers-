const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Alert = sequelize.define(
  'Alert',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'critical'),
      allowNull: false,
      defaultValue: 'info'
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'manual'
    },
    sourceKey: {
      type: DataTypes.STRING,
      allowNull: true
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    tableName: 'alerts',
    timestamps: true
  }
);

module.exports = Alert;
