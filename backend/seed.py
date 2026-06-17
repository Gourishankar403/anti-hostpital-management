import os
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from app.core.security import get_password_hash

def seed_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        print("Creating admin user...")
        admin = models.User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            name="System Admin",
            email="admin@bmhhospital.com",
            role="Admin",
            active=True
        )
        db.add(admin)
        
    stages = db.query(models.WorkflowStage).all()
    if not stages:
        print("Creating default workflow stages...")
        db.add_all([
            models.WorkflowStage(stage_number=1, name="COO"),
            models.WorkflowStage(stage_number=2, name="Finance"),
            models.WorkflowStage(stage_number=3, name="IT"),
        ])

    dept = db.query(models.User).filter(models.User.username == "dept").first()
    if not dept:
        print("Creating department user...")
        dept = models.User(
            username="dept",
            password_hash=get_password_hash("dept123"),
            name="Cardiology Dept",
            email="cardiology@bmhhospital.com",
            role="Department",
            department="Cardiology",
            active=True
        )
        db.add(dept)

    stage1 = db.query(models.User).filter(models.User.username == "coo").first()
    if not stage1:
        print("Creating COO user...")
        stage1 = models.User(
            username="coo",
            password_hash=get_password_hash("coo123"),
            name="Chief Operating Officer",
            email="coo@bmhhospital.com",
            role="Stage 1",
            active=True
        )
        db.add(stage1)
        
    stage2 = db.query(models.User).filter(models.User.username == "finance").first()
    if not stage2:
        print("Creating Finance user...")
        stage2 = models.User(
            username="finance",
            password_hash=get_password_hash("finance123"),
            name="Finance Head",
            email="finance@bmhhospital.com",
            role="Stage 2",
            active=True
        )
        db.add(stage2)
        
    stage3 = db.query(models.User).filter(models.User.username == "it").first()
    if not stage3:
        print("Creating IT user...")
        stage3 = models.User(
            username="it",
            password_hash=get_password_hash("it123"),
            name="Vipin T P",
            email="it@bmhhospital.com",
            role="Stage 3",
            active=True
        )
        db.add(stage3)
        
    db.commit()
    db.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed_db()
