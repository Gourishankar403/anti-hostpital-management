from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.core import security, deps
from app import models, schemas
from datetime import timedelta
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

from sqlalchemy import func

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(func.lower(models.User.username) == form_data.username.lower()).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        print(f"FAILED LOGIN: typed_username='{form_data.username}', typed_password='{form_data.password}', user_exists={user is not None}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(deps.get_current_active_user)):
    return current_user
