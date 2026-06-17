from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.core.smtp_config import get_smtp_config, set_smtp_config
from app import models
from app.routers.auth import get_current_active_user

router = APIRouter(
    prefix="/config",
    tags=["config"]
)

class SMTPConfigUpdate(BaseModel):
    smtp_user: str
    smtp_password: str

class SMTPConfigResponse(BaseModel):
    smtp_user: str
    # Do not return password for security, just indicate if it's set
    has_password: bool

@router.get("/smtp", response_model=SMTPConfigResponse)
def get_smtp_settings(current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can view SMTP settings")
    
    config = get_smtp_config()
    return SMTPConfigResponse(
        smtp_user=config.get("SMTP_USER", ""),
        has_password=bool(config.get("SMTP_PASSWORD"))
    )

@router.post("/smtp")
def update_smtp_settings(settings: SMTPConfigUpdate, current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can update SMTP settings")
    
    success = set_smtp_config(settings.smtp_user, settings.smtp_password)
    return {"status": "success", "message": "SMTP settings updated successfully"}
