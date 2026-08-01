const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define(
  'Category',
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
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
      defaultValue: 'expense'
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#2B6CB0'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'tag'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: 'categories',
    timestamps: true
  }
);

module.exports = Category;
