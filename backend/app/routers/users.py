from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.deps import get_current_active_user
from app.core import security
from app import models, schemas

router = APIRouter(prefix="/api/users", tags=["users"])

def check_admin(user: models.User):
    if user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    check_admin(current_user)
    return db.query(models.User).all()

@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    check_admin(current_user)
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        name=user.name or user.username,
        email=user.email or f"{user.username}@example.com",
        department=user.department,
        role=user.role,
        stage_id=user.stage_id,
        active=user.active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    check_admin(current_user)
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict()
    update_data['name'] = update_data.get('name') or db_user.name or update_data.get('username')
    update_data['email'] = update_data.get('email') or db_user.email or f"{update_data.get('username')}@example.com"
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/{user_id}/reset-password")
def reset_password(user_id: int, new_password: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    check_admin(current_user)
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.password_hash = security.get_password_hash(new_password)
    db.commit()
    return {"msg": "Password updated successfully"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    check_admin(current_user)
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete the primary admin account")
        
    db.delete(db_user)
    db.commit()
    return {"msg": "User deleted successfully"}
