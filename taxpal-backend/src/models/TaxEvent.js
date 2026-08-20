const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TaxEvent = sequelize.define(
  'TaxEvent',
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isCustom: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: 'tax_events',
    timestamps: true
  }
);

module.exports = TaxEvent;
