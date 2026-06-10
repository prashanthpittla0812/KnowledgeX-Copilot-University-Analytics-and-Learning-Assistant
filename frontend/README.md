# KnowledgeX Copilot — Frontend

The frontend for the KnowledgeX Copilot platform is a modern, responsive single-page application built with **React**, **Vite**, and **TailwindCSS**.

## Technologies Used

- **React 18**
- **Vite** (Build Tool)
- **TailwindCSS** (Styling)
- **Framer Motion** (Animations)
- **React Router** (Navigation)
- **Recharts** (Data Visualization)
- **Lucide React** (Icons)
- **React Hot Toast** (Notifications)

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- npm or yarn

### 2. Installation
Navigate to the `frontend` directory and install the required dependencies:
```bash
cd frontend
npm install
```

### 3. Environment Variables
Create a `.env` file in the `frontend` root directory to specify the backend API URL. If not provided, it defaults to `http://localhost:8000/api/v1`.
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 4. Running the Development Server
Start the local Vite development server:
```bash
npm run dev
```
The application will usually be available at `http://localhost:5173`. Open this URL in your browser to interact with KnowledgeX Copilot.

## Core Workflows

1. **Student Registration**: Students can register via `/register`. After registering, their account is "PENDING" and awaits admin approval.
2. **Login**: Users (Students, Faculty, and Admins) sign in at the root path (`/`). The system automatically routes users to their respective dashboards based on their role.
3. **Change Password**: When admins create faculty accounts, they are generated with a temporary password. Upon first login, faculty must change their password at `/change-password` before proceeding.

## Folder Structure
- `src/api.ts` — Axios instance configuration and API request definitions.
- `src/components/` — Reusable UI components (buttons, inputs, stats cards).
- `src/pages/` — Main view components (Home, Register, Dashboard).
- `src/App.jsx` — Application routing and Protected Routes logic.
