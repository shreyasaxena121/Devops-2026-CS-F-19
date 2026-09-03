# 🛒 CampusCart — College Marketplace Platform

CampusCart is a full-stack MERN marketplace built exclusively for college students to buy, sell, and trade items within their campus community.

## 🚀 Features

- **User Authentication** — JWT-based secure login & registration
- **Product Listings** — Create, edit, and manage product listings with image uploads via Cloudinary
- **AI Description Generator** — Auto-generate product descriptions using AI
- **Wishlist** — Save items for later
- **Buy Requests** — Send purchase requests to sellers
- **Admin Dashboard** — Manage users and listings
- **Search & Filters** — Find products easily

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | JWT (Access + Refresh Tokens) |
| Images | Cloudinary |
| Styling | CSS Modules |

## 📁 Project Structure

```
campuscart/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── services/
│   └── public/
├── server/          # Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── middleware/
└── README.md
```

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/shreyasaxena121/Devops-2026-CS-F-19.git
cd Devops-2026-CS-F-19

# Backend
cd server && npm install
cp .env.example .env  # fill in your MongoDB URI, JWT secrets, Cloudinary keys
npm start

# Frontend (new terminal)
cd client && npm install
npm run dev
```

## 👥 Team

- **Shreya Saxena** (shreyasaxena121)
- **Yuvraj Singh** (yuvrajsingh47471-blip)
- **Yug Yadav** (YugYadav07)
