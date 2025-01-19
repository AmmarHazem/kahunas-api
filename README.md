# Kahunas Coaching API

A robust NestJS-based REST API for managing coaching sessions, user management, and analytics.

## Deployment

The API is currently hosted on AWS EC2 and accessible at:
http://13.127.188.120:80

The application is monitored using AWS CloudWatch for logging, metrics, and performance monitoring.

## Features

- 🔐 Authentication & Authorization
  - JWT-based authentication
  - Role-based access control (Admin, Coach, Client)
  - User registration and login

- 👥 User Management
  - User profiles
  - Role management
  - Admin user creation

- 📅 Session Management
  - Create and manage coaching sessions
  - Upcoming sessions for coaches and clients
  - Completed sessions tracking
  - Session status management

- 📊 Analytics
  - Coach performance statistics
  - Client progress tracking
  - Top coaches ranking

## Tech Stack

- NestJS - Progressive Node.js framework
- TypeORM - ORM for database management
- SQLite - Database (development)
- JWT - Authentication
- Class Validator - DTO validation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# Database (if using MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=coaching_db
```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

### Auth Endpoints
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login

### Users Endpoints
- `GET /users/profile` - Get user profile
- `PUT /users/:id` - Update user
- `POST /users/admin` - Create admin user
- `GET /users/clients` - List all clients (Admin only)

### Sessions Endpoints
- `POST /sessions` - Create a session
- `GET /sessions` - List all sessions
- `GET /sessions/client-upcoming` - Get client's upcoming sessions
- `GET /sessions/coach-upcoming` - Get coach's upcoming sessions
- `GET /sessions/client-complete` - Get client's completed sessions
- `GET /sessions/coach-complete` - Get coach's completed sessions
- `PUT /sessions/:id` - Update session
- `DELETE /sessions/:id` - Delete session (Admin only)

### Analytics Endpoints
- `GET /analytics/coach/stats` - Get coach statistics
- `GET /analytics/client/progress` - Get client progress
- `GET /analytics/coaches/top` - Get top coaches

## Security

- Rate limiting implemented
- JWT authentication
- Role-based access control
- Request validation using DTOs
