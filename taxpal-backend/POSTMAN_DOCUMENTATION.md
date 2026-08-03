# 🚀 TaxPal Postman Request Examples & API Guide - Milestone 1

This document provides sample JSON payloads, HTTP headers, and URL routes for testing the **TaxPal Backend APIs** using Postman.

---

## 🔑 1. User Authentication APIs

### A. Register User (`POST /api/auth/register`)
- **URL**: `http://localhost:5000/api/auth/register`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Aarav Mehta",
  "email": "aarav@taxpal.com",
  "country": "India",
  "password": "Password@123"
}
```
- **Response (201 Created)**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Aarav Mehta",
    "email": "aarav@taxpal.com",
    "country": "India"
  }
}
```

---

### B. Login User (`POST /api/auth/login`)
- **URL**: `http://localhost:5000/api/auth/login`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "aarav@taxpal.com",
  "password": "Password@123"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Aarav Mehta",
    "email": "aarav@taxpal.com",
    "country": "India"
  }
}
```

---

## 💰 2. Transaction CRUD APIs

> 🔒 All transaction requests require the header:
> `Authorization: Bearer <your_jwt_token_here>`

### A. Create Income Transaction (`POST /api/transactions`)
- **URL**: `http://localhost:5000/api/transactions`
- **Method**: `POST`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
  "type": "income",
  "amount": 85000,
  "category": "Freelance Software",
  "description": "Web Application Development Contract",
  "date": "2026-08-01T10:00:00.000Z"
}
```

---

### B. Create Expense Transaction (`POST /api/transactions`)
- **URL**: `http://localhost:5000/api/transactions`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
  "type": "expense",
  "amount": 15000,
  "category": "Software Subscriptions",
  "description": "AWS Cloud Hosting",
  "date": "2026-08-02T14:30:00.000Z"
}
```

---

### C. Get All Transactions (`GET /api/transactions`)
- **URL**: `http://localhost:5000/api/transactions?page=1&limit=20`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transactions fetched successfully",
  "data": {
    "transactions": [
      {
        "id": 1,
        "userId": 1,
        "type": "income",
        "amount": 85000,
        "category": "Freelance Software",
        "description": "Web Application Development Contract",
        "date": "2026-08-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 1,
      "totalPages": 1
    }
  }
}
```

---

### D. Update Transaction (`PATCH /api/transactions/:id`)
- **URL**: `http://localhost:5000/api/transactions/1`
- **Method**: `PATCH`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
  "amount": 90000,
  "description": "Updated contract amount"
}
```

---

### E. Delete Transaction (`DELETE /api/transactions/:id`)
- **URL**: `http://localhost:5000/api/transactions/1`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <jwt_token>`

---

## 📊 3. Dashboard API (`GET /api/dashboard`)

- **URL**: `http://localhost:5000/api/dashboard`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Dashboard summary fetched successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Aarav Mehta",
      "email": "aarav@taxpal.com",
      "country": "India"
    },
    "totalIncome": 90000,
    "totalExpenses": 15000,
    "currentBalance": 75000,
    "latest5Transactions": [
      {
        "id": 2,
        "userId": 1,
        "type": "expense",
        "amount": 15000,
        "category": "Software Subscriptions",
        "description": "AWS Cloud Hosting"
      },
      {
        "id": 1,
        "userId": 1,
        "type": "income",
        "amount": 90000,
        "category": "Freelance Software",
        "description": "Updated contract amount"
      }
    ]
  }
}
```
