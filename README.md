# form. — E-Commerce REST API (Backend)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/JWT-Authentication-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
</p>

---

## 🌟 Overview

The **form. Backend** is a modular RESTful API service built with **Express 5**, **Node.js**, and **MongoDB (Mongoose)**. It provides complete business logic for catalog browsing, role-based authentication, cart persistence and guest-to-user merging, stock reservations, order management, multi-address handling, and testimonial review moderation.

Developed as part of the **National Telecommunication Institute (NTI)** Full-Stack Development track.

---

## 🚀 Features

- **Authentication & Security**:
  - JWT token generation & verification.
  - Password hashing with `bcrypt`.
  - Role-Based Access Control (`admin` and `user` authorization).
  - Account blocking and soft-deletion flags.
- **Product & Inventory Management**:
  - Dynamic categorization and subcategory generation via `slugify`.
  - Image file uploads managed with `multer` and served via static route `/files/uploads`.
  - Text search, price filtering, and pagination support.
  - Soft-delete to preserve order history references.
- **Cart Engine**:
  - Server cart synchronization.
  - Guest cart merging endpoint (`/api/v1/cart/item/guest`) with price-change detection.
- **Order Processing & Transactions**:
  - Stock validation and decrement prior to order creation.
  - Atomic transactions where supported with graceful fallback for standalone Mongo instances.
  - Snapshotting of delivery address and contact phone at the moment of purchase.
- **Testimonial Moderation**:
  - Customer review submission with admin review and approval lifecycle.
- **Logging & Error Handling**:
  - Winston logging for operational events.
  - Structured HTTP error response format (`AppError`).

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/e_commerce
SECRET_KEY=your_jwt_secret_key_here
JWT_EXPIRIES_IN=12h
NODE_ENV=DEV
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:4000
```

---

## 🛠 Local Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Development Mode** (with automatic restarts via `nodemon`):
   ```bash
   npm start
   ```

3. **Format Code**:
   ```bash
   npm run format
   ```

---

## 📡 API Endpoints Summary

- **Auth**: `/api/v1/auth/signup`, `/api/v1/auth/login`
- **Products**: `/api/v1/product` (GET, POST, PUT, DELETE)
- **Cart**: `/api/v1/cart` (GET, POST `/item`, POST `/item/guest`, PUT `/item/:id`, DELETE)
- **Orders**: `/api/v1/order` (GET, POST `/create-order`, PUT `/update-order`)
- **Users & Addresses**: `/api/v1/user` (GET, PUT, DELETE, `/address` CRUD)
- **Testimonials**: `/api/v1/testimonial` (GET, POST, PATCH `/:id/status`, DELETE)

---

## 👨‍💻 Author

- **Developer**: Mohamed Ali
- **Project**: NTI Graduation E-Commerce Platform

