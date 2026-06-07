# KnowledgeX Copilot

An AI-powered academic assistant platform built with an Enterprise-grade Tech Stack. This full-stack application enables real-time student analytics, dynamic quiz generation via LLMs, and robust administrative workflows.

## Architecture

KnowledgeX Copilot is structured as a robust split-stack architecture:

- **Frontend (`/frontend`)**: A fast, responsive, and beautifully designed Single Page Application (SPA) built with React, Vite, and TailwindCSS.
- **Backend (`/backend`)**: A high-performance Python server built with FastAPI, utilizing a MySQL database via SQLAlchemy, and LangChain for LLM integrations.

## How to Run the Application

To run KnowledgeX Copilot locally, you must start both the **Backend API Server** and the **Frontend Development Server** concurrently. You will need two separate terminal windows.

### Step 1: Start the Backend
The backend runs on Python and provides all the data and AI processing capabilities.

1. Open your **first terminal**.
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Activate the virtual environment (if you are using one):
   ```bash
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
4. Start the FastAPI server using `uvicorn`:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *Your backend is now running at `http://localhost:8000`. You can view the API documentation at `http://localhost:8000/docs`.*

### Step 2: Start the Frontend
The frontend is the graphical user interface for students, faculty, and admins.

1. Open your **second terminal**.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies (if this is your first time):
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Your frontend is now running at `http://localhost:5173`. Open this URL in your web browser to use the application!*

---

### Detailed Documentation
For deep-dives into specific subsystems, see the localized READMEs:
- **[Backend Setup & API Guide](backend/README.md)**
- **[Frontend Setup & Architecture](frontend/README.md)**