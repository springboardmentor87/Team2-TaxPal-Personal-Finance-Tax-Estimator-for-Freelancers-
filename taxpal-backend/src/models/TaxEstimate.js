const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TaxEstimate = sequelize.define(
  'TaxEstimate',
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
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    filingStatus: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'filing_status'
    },
    quarter: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    grossIncomeForQuarter: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'gross_income_for_quarter',
      defaultValue: 0.00
    },
    businessExpenses: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'business_expenses',
      defaultValue: 0.00
    },
    retirementContribution: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'retirement_contribution',
      defaultValue: 0.00
    },
    healthInsurancePremiums: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'health_insurance_premiums',
      defaultValue: 0.00
    },
    homeOfficeDeduction: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'home_office_deduction',
      defaultValue: 0.00
    },
    estimatedTax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'estimated_tax',
      defaultValue: 0.00
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date'
    }
  },
  {
    tableName: 'tax_estimates',
    timestamps: true
  }
);

module.exports = TaxEstimate;
