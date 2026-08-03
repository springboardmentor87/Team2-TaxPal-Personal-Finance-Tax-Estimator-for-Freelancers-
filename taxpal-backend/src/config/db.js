const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'taxpal',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: (process.env.DB_DIALECT || 'mysql').toLowerCase(),
    logging: false,
  }
);

const ensureDatabaseExists = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
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
    await sequelize.sync();
    console.log('✅ MySQL models & tables synchronized successfully');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
  }
};

module.exports = {
  sequelize,
  connectDB,
};