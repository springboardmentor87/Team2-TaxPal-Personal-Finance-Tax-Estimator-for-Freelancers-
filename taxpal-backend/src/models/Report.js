const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Report = sequelize.define(
  'Report',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    period: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Current Month'
    },
    reportType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'report_type',
      defaultValue: 'Income Statement'
    },
    filePath: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'file_path'
    },
    format: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PDF'
    }
  },
  {
    tableName: 'reports',
    timestamps: true
  }
);

module.exports = Report;
