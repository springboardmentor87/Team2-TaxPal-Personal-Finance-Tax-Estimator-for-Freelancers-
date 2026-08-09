const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Budget = sequelize.define(
  'Budget',
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
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: true
    },
    period: {
      type: DataTypes.ENUM('weekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: false,
      defaultValue: 'monthly'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('amount');
        return val === null ? null : parseFloat(val);
      }
    },
    alertThreshold: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.8
    }
  },
  {
    tableName: 'budgets',
    timestamps: true
  }
);

module.exports = Budget;
