from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Category, Product
from schemas.category import CategoryCreate, CategoryUpdate
from auth import require_admin_or_mod

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).filter(Category.STATUS == 1).all()
    return [{"id": c.ID_CATEGORY, "cod_name": c.COD_NAME, "des_category": c.DES_CATEGORY, "status": c.STATUS} for c in cats]

@router.get("/all")
def get_all_categories(current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [{"id": c.ID_CATEGORY, "cod_name": c.COD_NAME, "des_category": c.DES_CATEGORY, "status": c.STATUS} for c in cats]

@router.post("")
def create_category(body: CategoryCreate, current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    if not body.cod_name.strip():
        raise HTTPException(status_code=400, detail="El nombre de la categoría es requerido")
    if db.query(Category).filter(Category.COD_NAME == body.cod_name).first():
        raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre")
    cat = Category(COD_NAME=body.cod_name, DES_CATEGORY=body.des_category)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"message": "Categoría creada", "id": cat.ID_CATEGORY, "cod_name": cat.COD_NAME}

@router.put("/{id}")
def update_category(id: int, body: CategoryUpdate, current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.ID_CATEGORY == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if body.cod_name is not None: cat.COD_NAME = body.cod_name
    if body.des_category is not None: cat.DES_CATEGORY = body.des_category
    if body.status is not None: cat.STATUS = body.status
    db.commit()
    return {"message": "Categoría actualizada"}

@router.delete("/{id}")
def delete_category(id: int, current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.ID_CATEGORY == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if db.query(Product).filter(Product.ID_CATEGORY == id).count() > 0:
        raise HTTPException(status_code=400, detail="No puedes eliminar una categoría con productos asociados")
    db.delete(cat)
    db.commit()
    return {"message": "Categoría eliminada"}