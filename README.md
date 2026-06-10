# KnowledgeX Copilot

An AI-powered academic assistant platform built with an Enterprise-grade Tech Stack. This full-stack application enables real-time student analytics, dynamic quiz generation via LLMs, robust administrative workflows, and a Multimodal RAG system for learning materials.

## Architecture

KnowledgeX Copilot is structured as a robust split-stack architecture:

- **Frontend (`/frontend`)**: A fast, responsive, and beautifully designed Single Page Application (SPA) built with React, Vite, and TailwindCSS.
- **Backend (`/backend`)**: A high-performance Python server built with FastAPI, utilizing a Supabase PostgreSQL database via SQLAlchemy AsyncPG, and LangChain/Groq for LLM integrations.

---

## 🚀 Quick Start Guide for New Developers

Follow these instructions to pull the code and run the platform directly on your local system.

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Git**
- **Python 3.10+** (Ensure Python is added to your system PATH)
- **Node.js 18+** (Includes `npm`)

### External System Dependencies (CRITICAL)
Some AI features (like Audio transcription and Vector Embeddings) require external system software to function. If you skip these, the backend will throw errors when uploading files!

1. **FFmpeg** (Required for Audio Chatbot)
   - *Why?* The `faster-whisper` engine uses FFmpeg to decode audio files.
   - **Windows**: Download [FFmpeg](https://ffmpeg.org/download.html), extract it, and add the `bin` folder to your System Environment Variables (`PATH`).
   - **Mac**: `brew install ffmpeg`
   - **Linux**: `sudo apt install ffmpeg`

2. **Ollama** (Required for Multimodal RAG & Document Search)
   - *Why?* The backend uses local Ollama to generate vector embeddings for ChromaDB.
   - Download and install from [ollama.com](https://ollama.com).
   - Once installed, open your terminal and pull the required embedding model:
     ```bash
     ollama run nomic-embed-text
     ```
     *(Keep the Ollama app running in the background while using KnowledgeX).*

3. **Visual C++ Redistributable** (Windows Only)
   - *Why?* Required by underlying machine learning libraries (like `CTranslate2`).
   - Download and install the latest version from Microsoft.

### 1. Clone the Repository
Open your terminal and run:
```bash
git clone <your-repository-url>
cd "KnowledgeX Copilot"
git checkout main
```

---

### 2. Set Up the Backend
The backend requires a Python virtual environment and a configured `.env` file to connect to the Supabase PostgreSQL database and AI providers.

1. **Create and Activate a Virtual Environment**
   Run the following from the root of the project to create a virtual environment named `.venv`:
   ```bash
   # Windows:
   python -m venv .venv
   .\.venv\Scripts\activate

   # Mac/Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Backend Dependencies**
   Navigate to the backend directory and install the required packages:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
   *(Note: This installs all dependencies including `faster-whisper` for audio processing and FastAPI).*

3. **Configure Environment Variables**
   Inside the `backend` folder, duplicate the `.env.example` file and rename the copy to `.env`.
   ```bash
   cp .env.example .env
   ```
   Open the new `.env` file and fill in the required credentials:
   - `DATABASE_URL`: Provide the Supabase PostgreSQL connection string (use `postgresql+asyncpg://...`).
   - `GROQ_API_KEY`: Provide your Groq API key for the AI model.

4. **Start the Backend Server**
   Ensure your virtual environment is still activated and you are in the `backend` directory. Start the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *Your backend is now running at `http://localhost:8000`. API documentation is available at `http://localhost:8000/docs`.*

---

### 3. Set Up the Frontend
The frontend requires Node.js to install packages and run the Vite development server.

1. **Open a New Terminal Window**
   Keep the backend running in your first terminal. Open a second terminal window and navigate to the project root.

2. **Navigate and Install Packages**
   ```bash
   cd frontend
   npm install
   ```

3. **Start the Frontend Server**
   ```bash
   npm run dev
   ```
   *Your frontend is now running at `http://localhost:5173`. Open this URL in your web browser to use the application!*

---

## 📚 Seed Data & Default Logins

If you have successfully connected to the shared Supabase database, you can immediately log into the application using the default accounts:

- **Admin Account**: `admin@knowledgex.com`
- **Faculty Account**: `faculty1@knowledgex.com` / `faculty2@knowledgex.com`
- **Student Account**: `student1@knowledgex.com` / `student2@knowledgex.com`
- **Default Password for all accounts**: `Password@123`

---

## 🛠️ Detailed Documentation
For deep-dives into specific subsystems, see the localized READMEs:
- **[Backend Setup & API Guide](backend/README.md)**
- **[Frontend Setup & Architecture](frontend/README.md)**