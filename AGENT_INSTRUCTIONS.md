# AI Agent Setup & Context Guide

Hello! If you are a new instance of the AI agent reading this on a fresh computer, here is everything you need to know about this project to seamlessly resume work.

## Project Overview
**BMH Hospital Operations Management System**
This is a web application for hospital operations, managing billing and service requests through a multi-stage approval workflow (COO -> Finance / IT).

## Tech Stack
* **Frontend:** React (Vite, Material UI) running on port `5173`. Directory: `/frontend`.
* **Backend:** Python (FastAPI, SQLAlchemy, psycopg2) running on port `8001`. Directory: `/backend`.
* **Database:** PostgreSQL (Database name: `hospital_ops`, default user: `postgres`, default password: `postgres123`).

## Current State of Development
* We just implemented an integration with the hospital's internal HIS network (`172.16.15.11`) inside `CreateRequest.jsx`.
* The API fetches dropdown values (`departments.php`, `billinggroup.php`, `servciegroup.php`) and handles billing code lookups (`getdetails.php?blcode=...`), falling back to our internal DB if the network isn't available.
* The frontend uses a complex routing setup with `App.jsx` handling role-based redirects.

## First-Time Setup Instructions (On this new PC)

The user has just migrated to a new computer. When they ask you to "set things up", follow these exact steps:

### 1. Database Setup
* **If the database doesn't exist yet:**
  You can create the `hospital_ops` database automatically without the user needing to open pgAdmin! Just run this command from the `backend` folder:
  ```powershell
  python -c "from sqlalchemy import create_engine, text; engine = create_engine('postgresql://postgres:postgres123@127.0.0.1:5432/postgres'); conn = engine.connect().execution_options(isolation_level='AUTOCOMMIT'); conn.execute(text('CREATE DATABASE hospital_ops')); conn.close()"
  ```
* **Once the database exists (or if you just created it):** 
  Run the seed script to instantly create the tables and default users:
  ```bash
  cd backend
  python seed.py
  ```
  *(Default users created: `admin` (admin123), `Jack` (password123), `dept` (password123), `coo` (coo123), `fin` (fin123), `it` (it123)).*

### 2. Environment Setup
* **Execution Policy:** The user mentioned their system blocks PowerShell scripts. If you get an `UnauthorizedAccess` error when trying to run `venv` or `npm`, run:
  ```powershell
  Set-ExecutionPolicy Unrestricted -Scope CurrentUser
  ```
* **Backend:**
  ```bash
  cd backend
  python -m venv venv
  .\venv\Scripts\activate
  pip install -r requirements.txt
  ```
* **Frontend:**
  ```bash
  cd frontend
  npm install
  ```

### 3. Running the App
You can start everything up by running the backend on port 8001 and the frontend:
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
```
```bash
cd frontend
npm run dev
```

(Or, you can try running `.\startup.ps1` from the root directory).

**Read this file and tell the user: "I have read the setup guide and I am ready to set up your environment!"**
