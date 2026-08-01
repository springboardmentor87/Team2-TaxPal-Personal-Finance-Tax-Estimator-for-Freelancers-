# 🚀 TaxPal Backend Setup Guide for Team Members

TaxPal Backend is built using **Node.js, Express, MySQL, and Sequelize ORM**.

---

## 📋 Prerequisites for Team Members

Ensure you have the following installed on your machine:
1. **Node.js** (v16 or higher)
2. **MySQL Server 8.0** or **XAMPP / WAMP**

---

## 🛠️ Step-by-Step Setup Guide for Group Members

### Step 1: Install Dependencies
Open your terminal in the `taxpal-backend` directory and run:
```bash
npm install
```

### Step 2: Create Environment Configuration (`.env`)
Create a file named `.env` inside the `taxpal-backend/src/` directory with the following content:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=taxpal
DB_DIALECT=mysql
JWT_SECRET=taxpal_secret_jwt_key_2026
```

> **Note**: Change `DB_PASSWORD` to match your local MySQL server password (e.g. leave blank if using XAMPP without a password).

---

### Step 3: Run the Server (Automatic Database & Table Creation)

You **DO NOT** need to write SQL script files manually to create the database! 
The backend code automatically connects to MySQL, creates the `taxpal` database, and generates all 5 tables (`users`, `transactions`, `budgets`, `categories`, `alerts`).

Start the server:
```bash
node src/server.js
```

**Expected Terminal Output**:
```text
✅ MySQL connected successfully via Sequelize
✅ MySQL models & tables synchronized successfully
Server running on port 5000
```

---

## 📂 Project API Base URL & Endpoints

- **Base URL**: `http://localhost:5000/api`
- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Transactions**: `/api/transactions`
- **Budgets**: `/api/budgets`
- **Categories**: `/api/categories`
- **Dashboard**: `/api/dashboard/summary`, `/api/dashboard/analytics`
- **Tax Estimate**: `/api/tax`
- **Reports**: `/api/reports/transactions`, `/api/reports/tax`, `/api/reports/dashboard`
- **Alerts**: `/api/alerts`