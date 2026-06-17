from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, stages, requests, audit
from app.database import engine, SessionLocal
from app import models
from app.core.security import get_password_hash

# For local development we can auto-create tables, but Alembic is preferred
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hospital Operations Management System")

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        users_to_create = [
            {"username": "admin", "name": "Admin", "email": "admin@hospital.com", "role": "Admin"},
            {"username": "department", "name": "Department", "email": "dept@hospital.com", "role": "Department"},
            {"username": "coo", "name": "COO", "email": "coo@hospital.com", "role": "Stage 1"},
            {"username": "finance", "name": "Finance", "email": "finance@hospital.com", "role": "Stage 2"},
            {"username": "it", "name": "IT", "email": "it@hospital.com", "role": "Stage 3"},
        ]
        
        for u in users_to_create:
            existing_user = db.query(models.User).filter(models.User.username == u["username"]).first()
            if not existing_user:
                new_user = models.User(
                    username=u["username"],
                    password_hash=get_password_hash("password123"), # Default password
                    name=u["name"],
                    email=u["email"],
                    role=u["role"],
                    active=True
                )
                db.add(new_user)
        db.commit()
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/processed", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(stages.router)
app.include_router(requests.router)
app.include_router(audit.router)

@app.get("/")
def root():
    return {"message": "Welcome to BMH Hospital Operations Management System API"}
