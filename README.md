# 💰 TaxPal - Personal Finance & Tax Estimator

## Overview

TaxPal is a web application designed to help freelancers and gig workers manage their personal finances efficiently. The system allows users to track income and expenses, organize transactions, monitor their financial health, and estimate taxes based on their region.

The project aims to simplify financial management by providing an easy-to-use platform for recording transactions and generating useful financial insights.

## Tech Stack

- Node.js
- Express.js
- MySQL (with Sequelize ORM)
- Angular (Frontend)

## 👥 Backend Implementation

1. **Install MySQL & Node.js** on their machine.
2. Go to backend folder: `cd taxpal-backend`
3. Install dependencies: `npm install`
4. Create `.env` file inside `taxpal-backend/src/.env`:
   ```env
   PORT=5000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=their_local_mysql_password
   DB_NAME=taxpal
   DB_DIALECT=mysql
   JWT_SECRET=taxpal_secret_jwt_key_2026
   ```
5. Start the backend: `node src/server.js`

> **Automatic Setup**: The code automatically creates the `taxpal` database and all 5 tables on their local MySQL server when started. No manual SQL scripts required!

## Project Status

🚧 Project is currently under active development.
