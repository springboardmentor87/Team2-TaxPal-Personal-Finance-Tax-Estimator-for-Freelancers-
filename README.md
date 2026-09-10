# 💰 TaxPal — Personal Finance & Tax Estimator for Freelancers

TaxPal is a modern, enterprise-grade personal finance, budget tracking, and multi-country tax estimation platform built specifically for gig workers, freelancers, and independent contractors.

---

## 🚀 Live Production Deployment & Architecture

TaxPal is fully containerized and deployed across 100% free cloud infrastructure:

| Component | Platform / Host | Live Endpoint & Details | Status |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **Vercel** | [https://taxxpal.vercel.app](https://taxxpal.vercel.app) | ✅ **Live & Verified** |
| **Backend REST API** | **Render** | [https://taxpal-backend-3hwc.onrender.com](https://taxpal-backend-3hwc.onrender.com) | ✅ **Live & Verified** |
| **Database Layer** | **Aiven MySQL** | `taxpal-omkarsbiradar165-e6c9.h.aivencloud.com:11488` | ✅ **Connected & Synced** |

---

## 🛠️ Technology Stack

* **Frontend**: Angular 17 (Standalone Components), RxJS, TailwindCSS, HTML5/CSS3.
* **Backend**: Node.js (v20 LTS), Express.js, JWT Authentication, bcryptjs.
* **Database**: MySQL 8.0, Sequelize ORM (with SSL dialect options for cloud hosting).
* **Reporting Engine**: PDFKit (executive styled tables & clean canvas layout), UTF-8 BOM CSV Exporter (`\uFEFF`).

---

## ✨ Key Features & Capabilities

* **Security & Auth**: Stateless JWT Bearer token authorization, salt-hashed password storage, and profile picture HTML5 Canvas scaling.
* **Income & Expense Tracking**: Full transaction CRUD with real-time summary recalculations (Total Income, Total Expenses, Net Cash Flow).
* **Budget Management & Alerts**: Monthly spending limits per category, percentage progress bars, and automated warning (80%) / critical (100%) alert engine.
* **Multi-Country Tax Calculator**: Tax slab estimation for India (New Tax Regime FY 2025-26), USA, UK, and Canada, with advance tax payment schedules.
* **Financial Statement Exports**: Generation and instant download of Income Statements, Expense Breakdowns, Transaction History, and Tax Summary reports in PDF, CSV, and print formats.

---

## 🛠️ Local Development Setup

### 1. Backend Setup (`taxpal-backend`)
```bash
cd taxpal-backend
npm install
```

Create `.env` inside `taxpal-backend/src/.env`:
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

Start backend:
```bash
node src/server.js
```
> **Note**: Sequelize automatically creates the database and all MySQL tables upon startup.

### 2. Frontend Setup (`taxpal-frontend`)
```bash
cd taxpal-frontend
npm install
npm start
```
Open your browser at `http://localhost:4200/`.

---

## ☁️ Cloud Deployment Configuration

### Aiven Cloud MySQL Setup
* Create a free MySQL 8.0 instance on [aiven.io](https://aiven.io).
* Set `DB_SSL=true` in backend environment variables to enable SSL mode.

### Render Backend Setup
* Deploy `taxpal-backend` on [render.com](https://render.com) as a Web Service.
* Root Directory: `taxpal-backend`
* Build Command: `npm install`
* Start Command: `node src/server.js`
* Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`, `JWT_SECRET`, `PORT=5000`.

### Vercel Frontend Setup
* Deploy `taxpal-frontend` on [vercel.com](https://vercel.com).
* Root Directory: `taxpal-frontend`
* Framework Preset: **Angular**
* Build Command: `ng build`
* Output Directory: `dist/taxpal-angular`

---

## 👥 Development Team

Developed as part of the **Infosys Springboard Internship Project (Batch 3) — Team 2**.
