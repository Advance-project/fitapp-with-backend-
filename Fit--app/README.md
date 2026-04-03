# FitApp With Backend

AI-Powered Fitness Management System  
Final Year Advanced Project - Full-Stack Mobile Application

## Introduction

FitApp is a full-stack mobile fitness application designed to demonstrate advanced software engineering concepts, including backend API development, mobile app development, database integration, authentication, AI integration, and automated testing.

The system enables users to create workout routines, log exercises, track progress, and interact with an AI-based fitness assistant. A FastAPI backend with MongoDB supports all core functionality.

## Objectives

- Design and implement a full-stack mobile application
- Develop a RESTful backend API using FastAPI
- Integrate MongoDB as the primary database
- Implement secure authentication using JWT
- Incorporate AI-based workout generation using RAG
- Build administrative management features
- Demonstrate testing using Pytest
- Maintain a clean and structured GitHub repository

## System Architecture

```text
Mobile Application (React Native / Expo)
                |
                v
REST API (FastAPI)
                |
                v
MongoDB Database
                |
                v
AI Module (RAG / Routine Generator)
```

The system follows a modular layered architecture with clear separation of concerns for maintainability and scalability.

## Technologies Used

| Category | Technology |
| --- | --- |
| Frontend | React Native, Expo, TypeScript |
| Backend | FastAPI (Python) |
| Database | MongoDB |
| Authentication | JWT |
| AI Module | Retrieval-Augmented Generation (RAG) |
| Testing | Pytest |
| API | REST |
| Version Control | Git, GitHub |

## Features

### User Features

- User registration and login
- Secure authentication
- Profile management
- Create and manage workout routines
- Log workout sessions
- Explore workout templates
- AI-based routine generation
- Chat-based fitness assistant
- Exercise tracking

### Admin Features

- Admin login
- View all users
- Access system statistics
- Manage workout templates
- View detailed user information

### AI Features

- AI-driven workout generation
- Routine recommendation
- Chat-based assistant
- Fitness knowledge retrieval using RAG

### Backend Features

- RESTful API using FastAPI
- Route-based modular structure
- MongoDB integration
- Configuration management
- Token-based authentication

### Testing

- Unit and integration testing using Pytest
- Authentication testing
- Utility function testing
- API endpoint validation

## Project Structure

```text
fitapp-with-backend/
|
+-- Fit--app/
|   +-- assets/
|   +-- screens/
|   +-- services/
|   +-- App.tsx
|   +-- README.md
|   +-- app.json
|   +-- babel.config.js
|   +-- index.ts
|   +-- package.json
|   +-- package-lock.json
|   +-- tsconfig.json
|   +-- .gitignore
|
+-- backend/
|   +-- app/
|   |   +-- routes/
|   |   +-- auth_utils.py
|   |   +-- config.py
|   |   +-- database.py
|   |   +-- fitness_rag.py
|   |   +-- main.py
|   |   +-- models.py
|   +-- tests/
|   |   +-- conftest.py
|   |   +-- test_auth.py
|   |   +-- test_utils.py
|   +-- TESTING.md
|   +-- pytest.ini
|   +-- run.py
|   +-- seed_user_accounts_data.py
|   +-- .env.example
|   +-- .gitignore
|
+-- README.md
```

## Installation Guide

### 1. Clone Repository

```bash
git clone https://github.com/Advance-project/fitapp-with-backend-.git
cd fitapp-with-backend
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Backend runs at: `http://localhost:8000`

### 3. Environment Configuration

Create `.env` in the `backend` directory:

```dotenv
MONGODB_URI=your_mongodb_connection_string
DB_NAME=fit_app
SECRET_KEY=your_strong_random_secret
OPENAI_API_KEY=your_openai_api_key
```

### 4. Frontend Setup

```bash
cd Fit--app
npm install
npx expo start
```

## AI Module

Primary modules:

- `fitness_rag.py`
- `routes/ai.py`

Supports:

- Workout routine generation
- Fitness question answering
- Chat-based assistance
- Knowledge retrieval

## Sample API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /auth/login | User login |
| POST | /auth/signup | User registration |
| GET | /workouts/templates | Retrieve user routines |
| POST | /workouts/log | Log workout session |

## Testing

Run tests:

```bash
cd backend
pytest
```

Coverage includes:

- Authentication logic
- Utility functions
- API endpoint behavior

## Security

Implemented security measures:

- JWT-based authentication
- Password hashing
- Environment-variable-based secrets
- Protected API routes
- Admin-level authorization

## Future Improvements

- Wearable/sensor integrations
- Enhanced AI personalization
- Real-time workout tracking
- Cloud deployment with Docker
- Advanced analytics dashboard

## Learning Outcomes

This project demonstrates:

- Full-stack application development
- React Native mobile development
- FastAPI backend design
- MongoDB integration
- Authentication/security implementation
- Practical AI integration
- Testing and quality practices
- Modular architecture design

## Academic Information

- Program: Bachelor of Computer Science
- Course: Advanced Project (COMP 4431)
- Year: 2026
- University: Lakehead University
- Team: Margin Patel, Devanshu Chaudhari, Jasdeep Kaur, Yogesh Chandnani

## Acknowledgement

We thank all team members for their collaboration and dedication.

- Devanshu Chaudhari: Frontend development (React Native)
- Margin Patel: Backend development and full-stack integration
- Yogesh Chandnani: AI integration and RAG pipeline
- Jasdeep Kaur: Documentation, testing, and database population

We also acknowledge the use of generative AI tools for development support, testing data generation, and problem-solving assistance.

## License

This project is developed for academic purposes only.