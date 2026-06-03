# KnowledgeX Copilot — Backend

AI-powered academic assistant platform. Built with **FastAPI**, **MySQL**, **LangChain**, and **ChromaDB**.

## Tech Stack

| Layer          | Technology                         |
| -------------- | ---------------------------------- |
| Framework      | FastAPI (Python 3.12)              |
| Database       | MySQL + SQLAlchemy ORM             |
| Migrations     | Alembic                            |
| Auth           | JWT (python-jose) + bcrypt         |
| AI/LLM         | LangChain + OpenAI / Azure / Ollama |
| Vector Store   | ChromaDB                           |
| PDF Processing | PyPDF, Unstructured, LangChain     |
| Logging        | Loguru                             |

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI entry point
│   ├── config/
│   │   ├── settings.py         # Environment config
│   │   └── prompts.py          # LLM prompt templates
│   ├── database/
│   │   ├── db.py               # Async SQLAlchemy engine
│   │   ├── models.py           # ORM models
│   │   └── migrations/         # Alembic migrations
│   ├── auth/
│   │   ├── auth.py             # Auth service
│   │   ├── jwt_handler.py      # JWT encode/decode
│   │   ├── password.py         # bcrypt hashing
│   │   └── dependencies.py     # FastAPI Depends guards
│   ├── routes/                 # API endpoints (8 modules)
│   ├── services/               # Business logic (6 modules)
│   ├── schemas/                # Pydantic v2 models
│   ├── utils/                  # PDF, chunking, embeddings, logging
│   └── uploads/                # Uploaded files
├── requirements.txt
├── .env
├── alembic.ini
└── README.md
```

## Quick Start

### 1. Prerequisites

- Python 3.12+
- MySQL 8.0+
- (Optional) Ollama for local LLM

### 2. Clone & Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env` and update:

```env
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/knowledgex
JWT_SECRET_KEY=your-random-secret-here
OPENAI_API_KEY=sk-...          # or configure Azure/Ollama
```

### 4. Create MySQL Database

```sql
CREATE DATABASE knowledgex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run Migrations

```bash
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

### 6. Start Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000/docs` for Swagger UI.

## API Endpoints

### Authentication
| Method | Endpoint                    | Auth | Description          |
| ------ | --------------------------- | ---- | -------------------- |
| POST   | `/api/v1/auth/register`     | No   | Register new user    |
| POST   | `/api/v1/auth/login`        | No   | Login & get JWT      |
| GET    | `/api/v1/auth/me`           | JWT  | Current user profile |

### Users (Admin/Faculty)
| Method | Endpoint               | Auth    | Description       |
| ------ | ---------------------- | ------- | ----------------- |
| GET    | `/api/v1/users/`       | Admin   | List all users    |
| GET    | `/api/v1/users/{id}`   | Admin   | Get user details  |
| PUT    | `/api/v1/users/{id}`   | Admin   | Update user       |
| DELETE | `/api/v1/users/{id}`   | Admin   | Delete user       |

### Documents
| Method | Endpoint                        | Auth | Description             |
| ------ | ------------------------------- | ---- | ----------------------- |
| POST   | `/api/v1/documents/upload`      | JWT  | Upload PDF              |
| GET    | `/api/v1/documents/`            | JWT  | List user documents     |
| GET    | `/api/v1/documents/{id}`        | JWT  | Get document details    |
| DELETE | `/api/v1/documents/{id}`        | JWT  | Delete document         |

### Chatbot (RAG)
| Method | Endpoint           | Auth | Description          |
| ------ | ------------------ | ---- | -------------------- |
| POST   | `/api/v1/chat/`    | JWT  | Ask AI a question    |

### Quiz
| Method | Endpoint                   | Auth | Description          |
| ------ | -------------------------- | ---- | -------------------- |
| POST   | `/api/v1/quiz/generate`    | JWT  | Generate AI quiz     |
| POST   | `/api/v1/quiz/submit`      | JWT  | Submit quiz answers  |
| GET    | `/api/v1/quiz/history`     | JWT  | View quiz history    |

### Study Plan
| Method | Endpoint                        | Auth | Description              |
| ------ | ------------------------------- | ---- | ------------------------ |
| POST   | `/api/v1/studyplan/generate`    | JWT  | Generate study plan      |
| GET    | `/api/v1/studyplan/history`     | JWT  | View plan history        |

### Recommendations
| Method | Endpoint                                    | Auth         | Description              |
| ------ | ------------------------------------------- | ------------ | ------------------------ |
| GET    | `/api/v1/recommendations/{student_id}`      | JWT          | Generate recommendations |
| GET    | `/api/v1/recommendations/{student_id}/history` | JWT       | Recommendation history   |

### Dashboard (Faculty/Admin)
| Method | Endpoint                          | Auth          | Description          |
| ------ | --------------------------------- | ------------- | -------------------- |
| GET    | `/api/v1/dashboard/stats`         | Faculty/Admin | Platform stats       |
| GET    | `/api/v1/dashboard/performance`   | Faculty/Admin | Student performance  |
| GET    | `/api/v1/dashboard/learning-gaps` | Faculty/Admin | Learning gap analysis |

## API Testing (Postman)

### 1. Register a User
```http
POST http://localhost:8000/api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "StrongPass1",
  "role": "student"
}
```

### 2. Login
```http
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "john@university.edu",
  "password": "StrongPass1"
}
```
→ Copy `access_token` from response.

### 3. Use Token
Set `Authorization: Bearer <token>` header for all protected calls.

### 4. Upload a PDF
```http
POST http://localhost:8000/api/v1/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: @operating-systems.pdf
```

### 5. Ask a Question
```http
POST http://localhost:8000/api/v1/chat/
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "Explain process scheduling in OS"
}
```

### 6. Generate Quiz
```http
POST http://localhost:8000/api/v1/quiz/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "Database Management Systems",
  "difficulty": "medium",
  "number_of_questions": 5
}
```

### 7. Generate Study Plan
```http
POST http://localhost:8000/api/v1/studyplan/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "subjects": ["DBMS", "Operating Systems", "Computer Networks"],
  "exam_date": "2026-07-15",
  "daily_hours": 3
}
```

## Switching AI Providers

Set `AI_PROVIDER` in `.env`:

- **openai** — uses `OPENAI_API_KEY` and `OPENAI_MODEL`
- **azure** — uses `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`, `AZURE_OPENAI_DEPLOYMENT`
- **ollama** — uses `OLLAMA_BASE_URL` and `OLLAMA_MODEL`
