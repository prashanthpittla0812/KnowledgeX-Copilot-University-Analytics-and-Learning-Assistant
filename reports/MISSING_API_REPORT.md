# KnowledgeX Copilot Missing API Report

The frontend API client expects these backend routes. If your FastAPI route names differ, either add aliases or update `frontend/src/api.ts`.

## Authentication

- `POST /api/v1/auth/login`

Must return one of:

- `access_token`
- `token`
- `jwt`
- `data.access_token`

Recommended response:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "student1@knowledgex.com",
    "role": "student"
  }
}
```

## Faculty

- `POST /api/v1/faculty/upload`
- `POST /api/v1/faculty/generate-quiz`
- `GET /api/v1/faculty/documents`
- `GET /api/v1/faculty/quizzes`
- `GET /api/v1/faculty/quizzes/{quiz_id}/results`
- `GET /api/v1/faculty/learning-gaps`
- `GET /api/v1/faculty/dashboard`

Important behavior:

- Generated quizzes should be persisted.
- Published quizzes should be visible to students.
- Faculty results endpoint should return student attempts and scores.

## Student

- `GET /api/v1/student/quizzes`
- `POST /api/v1/student/quizzes/{quiz_id}/submit`
- `GET /api/v1/student/quiz-history`
- `GET /api/v1/student/recommendations`
- `GET /api/v1/student/study-plans`
- `GET /api/v1/student/weak-topics`
- `GET /api/v1/student/dashboard`

Important behavior:

- Quiz submission should calculate score.
- Quiz submission should create a quiz attempt record.
- Weak topics should be derived from quiz performance and analytics tables.

## Admin

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/stats`

Recommended dashboard metrics:

- Total students
- Total faculty
- Total quizzes
- Total documents
- Total attempts
- Average score

