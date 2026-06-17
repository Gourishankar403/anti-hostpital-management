from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.deps import get_current_active_user
from app import models, schemas

router = APIRouter(prefix="/api/stages", tags=["stages"])

@router.get("/", response_model=List[schemas.WorkflowStageResponse])
def get_stages(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return db.query(models.WorkflowStage).order_by(models.WorkflowStage.stage_number).all()

@router.put("/{stage_id}", response_model=schemas.WorkflowStageResponse)
def update_stage(stage_id: int, stage_update: schemas.WorkflowStageBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_stage = db.query(models.WorkflowStage).filter(models.WorkflowStage.id == stage_id).first()
    if not db_stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    db_stage.name = stage_update.name
    db.commit()
    db.refresh(db_stage)
    return db_stage
