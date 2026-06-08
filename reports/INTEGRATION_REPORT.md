# KnowledgeX Copilot Integration Report

## Project Structure

Expected structure:

```text
project/
├── backend/
└── frontend/
```

Backend and frontend are intended to run independently:

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

```powershell
cd frontend
npm run dev
```

## Backend Seed Assets

Created:

- `backend/seed_users.py`
- `backend/seed_documents.py`
- `backend/seed_quizzes.py`
- `backend/seed_attempts.py`
- `backend/seed_all.py`
- `backend/seed_utils.py`

Seed users:

- `admin@knowledgex.com`
- `faculty1@knowledgex.com`
- `faculty2@knowledgex.com`
- `student1@knowledgex.com`
- `student2@knowledgex.com`
- `student3@knowledgex.com`

Default password:

```text
Password@123
```

Run all seeders:

```powershell
cd backend
python seed_all.py
```

Run individual seeders:

```powershell
python seed_users.py
python seed_documents.py
python seed_quizzes.py
python seed_attempts.py
```

## Document Seeding

Sample documents:

- AI Notes
- Machine Learning Notes
- Data Science Notes

The script inserts records into the detected documents table and attempts to seed ChromaDB collection:

```text
knowledgex_documents
```

## Quiz Seeding

Seeded quiz levels:

- Easy Quiz: Machine Learning
- Medium Quiz: Deep Learning
- Hard Quiz: Optimization

Questions are inserted into the detected questions table and linked to quizzes.

## Student Attempts

Seeded example scores:

- Student1: 80
- Student2: 60
- Student3: 40

Learning gap examples:

- Machine Learning: 80
- Deep Learning: 40
- Optimization: 35

## Frontend Integration

Created:

- `frontend/.env`
- `frontend/.env.example`
- `frontend/src/api.ts`

Frontend environment:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

The Axios client automatically attaches:

```http
Authorization: Bearer <token>
```

Token storage key:

```text
knowledgex_token
```

## Authentication Flow

Expected flow:

```text
React Login
POST /auth/login
Receive JWT
Store JWT in localStorage
Axios interceptor attaches JWT
Protected dashboard APIs load by role
```

## End-to-End Workflow

Target workflow:

```text
Faculty logs in
Faculty uploads PDF
Faculty generates quiz
Quiz becomes visible to students
Student attempts quiz
Attempt and score are stored
Learning gaps are calculated
Faculty dashboard shows results and weak topics
```

