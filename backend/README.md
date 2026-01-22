# Chirkut Backend API

Backend API for Chirkut Mess Meal Manager built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file in the backend directory with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chirkut
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "01712345678"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### Meal Endpoints

#### Add Meal
```http
POST /api/meals
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2026-01-22",
  "mealType": "lunch",
  "guestCount": 0
}
```

#### Get Meals
```http
GET /api/meals?month=2026-01&userId=<userId>
Authorization: Bearer <token>
```

#### Get Monthly Stats
```http
GET /api/meals/stats/monthly?month=2026-01
Authorization: Bearer <token>
```

#### Update Meal (Admin Only)
```http
PUT /api/meals/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "guestCount": 2
}
```

#### Delete Meal (Admin Only)
```http
DELETE /api/meals/:id
Authorization: Bearer <token>
```

### Deposit Endpoints

#### Add Deposit (Admin Only)
```http
POST /api/deposits
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "<userId>",
  "amount": 2000,
  "date": "2026-01-22",
  "paymentMethod": "bkash",
  "note": "January deposit"
}
```

#### Get Deposits
```http
GET /api/deposits?month=2026-01
Authorization: Bearer <token>
```

#### Get User Deposits
```http
GET /api/deposits/user/:userId?month=2026-01
Authorization: Bearer <token>
```

### Expense Endpoints

#### Add Expense (Admin Only)
```http
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "grocery",
  "amount": 5000,
  "date": "2026-01-22",
  "description": "Rice and vegetables"
}
```

#### Get Expenses
```http
GET /api/expenses?month=2026-01&category=grocery
Authorization: Bearer <token>
```

#### Get Month Expenses
```http
GET /api/expenses/month/2026-01
Authorization: Bearer <token>
```

### Report Endpoints

#### Close Month (Admin Only)
```http
POST /api/reports/close-month
Authorization: Bearer <token>
Content-Type: application/json

{
  "month": "2026-01"
}
```

#### Validate Month Before Closing (Admin Only)
```http
POST /api/reports/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "month": "2026-01"
}
```

#### Get All Reports
```http
GET /api/reports
Authorization: Bearer <token>
```

#### Get Specific Month Report
```http
GET /api/reports/2026-01
Authorization: Bearer <token>
```

#### Get User Report History
```http
GET /api/reports/user/:userId
Authorization: Bearer <token>
```

### User Endpoints

#### Get All Users (Admin Only)
```http
GET /api/users
Authorization: Bearer <token>
```

#### Get Active Users
```http
GET /api/users/active
Authorization: Bearer <token>
```

#### Update User (Admin Only)
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "admin"
}
```

## 🔒 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 👥 User Roles

- **user**: Can add meals, view own data
- **admin**: Full access to all operations

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── mealController.js
│   │   ├── depositController.js
│   │   ├── expenseController.js
│   │   ├── reportController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js            # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Meal.js
│   │   ├── Deposit.js
│   │   ├── Expense.js
│   │   └── MonthlyReport.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── mealRoutes.js
│   │   ├── depositRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── reportRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   └── helpers.js         # Utility functions
│   └── server.js              # Entry point
├── .env
├── .gitignore
└── package.json
```

## 🧪 Testing the API

You can test the API using:
- Postman
- Thunder Client (VS Code extension)
- cURL
- Mobile app

## 📝 Notes

- Month format is always `YYYY-MM` (e.g., `2026-01`)
- Dates are in ISO format `YYYY-MM-DD`
- Once a month is closed, all data for that month is locked
- Only admins can edit/delete data
- Regular users can only add their own meals

## 🔧 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## 📄 License

ISC
