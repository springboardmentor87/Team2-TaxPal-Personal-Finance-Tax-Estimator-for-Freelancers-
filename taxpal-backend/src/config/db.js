const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const dialectOptions = {};
if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'taxpal',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: (process.env.DB_DIALECT || 'mysql').toLowerCase(),
    dialectOptions,
    logging: false,
  }
);

const ensureDatabaseExists = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      ssl: (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') ? { rejectUnauthorized: false } : undefined
    });

    const dbName = process.env.DB_NAME || 'taxpal';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
  } catch (error) {
    // If creation check fails, proceed and let Sequelize report connection status
  }
};

const connectDB = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully via Sequelize');

    require('../models');
    await sequelize.sync({ alter: true });
    console.log('✅ MySQL models & tables synchronized successfully');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
  }
};

module.exports = {
  sequelize,
  connectDB,
};