
# Wollo University Student Management System

A full-stack university management system built with Django (backend) + React (frontend).

---

## What this system does

- Admin portal: manage students, teachers, subjects, classes, attendance, grades, announcements
- Teacher portal: mark attendance, upload grades, view assigned class
- Student portal: view grades, attendance, register for courses, announcements

---

## Requirements — install these first

Before you start, make sure you have these installed on your computer:

1. **Python 3.10+** — https://www.python.org/downloads/
2. **Node.js 18+** — https://nodejs.org/
3. **PostgreSQL 14+** — https://www.postgresql.org/download/
4. **Git** — https://git-scm.com/

---

## Setup Instructions

### Step 1 — Clone the project

Open a terminal (PowerShell or CMD) and run:

```
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
```

Then go into the project folder:

```
cd YOUR_REPO_NAME
```

> Replace `YOUR_REPO_NAME` with the actual folder name created after cloning. For example if the GitHub link is `https://github.com/mahlet/wollo-university` then write `cd wollo-university`.

---

### Step 2 — Create the PostgreSQL database

Open **pgAdmin** or the **psql** command line and run:

```sql
CREATE DATABASE wollo_university;
```

> **Important:** You only need to create the empty database. You do NOT need to create any tables manually. Django will create all tables automatically in Step 5.

---

### Step 3 — Set up the backend

Open a terminal and go into the backend folder:

```
cd backend
```

Create a Python virtual environment:

```
python -m venv backend_env
```

Activate it:

- **Windows:** `backend_env\Scripts\activate`
- **Mac/Linux:** `source backend_env/bin/activate`

Install all Python packages:

```
pip install -r requirements.txt
```

---

### Step 4 — Create your `.env` file

Inside the `backend` folder, create a new file called `.env` (copy from `.env.example`):

```
copy .env.example .env
```

Then open `backend/.env` and change `your_postgres_password_here` to your actual PostgreSQL password.

Example:
```
DB_NAME=wollo_university
DB_USER=postgres
DB_PASSWORD=pg1234
```

---

### Step 5 — Create all database tables and seed data

Still inside the `backend` folder, run:

```
python manage.py migrate
```

This creates ALL tables (students, teachers, grades, attendance, etc.) automatically. You do NOT need to write any SQL.

Then create the default admin account:

```
python manage.py seed
```

---

### Step 6 — Start the backend server

```
python manage.py runserver 8000
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

Keep this terminal open.

---

### Step 7 — Set up the frontend

Open a **new terminal** (keep the backend running) and go to the frontend folder:

```
cd student-management
```

Install all JavaScript packages:

```
npm install
```

Start the frontend:

```
npm run dev
```

You will see something like:
```
Local: http://localhost:5173/
```

Open that URL in your browser.

---

## Login credentials

| Role    | Username              | Password                        |
|---------|-----------------------|---------------------------------|
| Admin   | admin                 | Admin@123!                      |
| Student | firstname.fathername  | Student ID (e.g. WOUR/1234/20)  |
| Teacher | firstname.fathername  | Password set by admin           |

---

## Project structure

```
├── backend/                 ← Django backend (API)
│   ├── accounts/            ← User authentication
│   ├── students/            ← Student management
│   ├── teachers/            ← Teacher management
│   ├── academics/           ← Subjects, classes, timetable
│   ├── results/             ← Grades
│   ├── attendance/          ← Attendance sessions
│   ├── announcements/       ← Announcements
│   ├── requests_app/        ← Add/drop and cafeteria requests
│   ├── settings_app/        ← University settings
│   ├── core/                ← Django settings and URLs
│   ├── requirements.txt     ← Python dependencies
│   └── .env.example         ← Copy this to .env and fill in your DB password
│
└── student-management/      ← React frontend
    ├── src/
    │   ├── components/      ← Admin components
    │   ├── pages/           ← Student and teacher pages
    │   ├── api/             ← API client
    │   └── data/            ← Data stores
    └── package.json         ← Node dependencies
```

---

## Common problems

**"Failed to fetch" on login page**
- Make sure the backend is running (`python manage.py runserver 8000`)
- Make sure your `.env` file exists and has the correct DB password

**"CORS error" in browser console**
- The frontend port must be in `CORS_ALLOWED_ORIGINS` in your `.env`
- Add your port (e.g. `http://localhost:5175`) to that list

**"Database does not exist" error**
- Make sure you created the database: `CREATE DATABASE wollo_university;`
- Check your `.env` has the correct `DB_PASSWORD`



