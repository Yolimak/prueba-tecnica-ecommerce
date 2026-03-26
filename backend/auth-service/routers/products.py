from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Category, Product
from schemas.product import ProductCreate, ProductUpdate
from auth import require_admin_or_mod

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("")
def get_products(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Product).filter(Product.STATUS == 1)
    if category_id:
        query = query.filter(Product.ID_CATEGORY == category_id)
    prods = query.all()
    return [{"id": p.ID_PRODUCT, "id_category": p.ID_CATEGORY, "des_product": p.DES_PRODUCT,
             "def_product": p.DEF_PRODUCT, "cod_value": float(p.COD_VALUE), "cod_iva": float(p.COD_IVA),
             "img_product": p.IMG_PRODUCT, "status": p.STATUS, "cod_tag": p.COD_TAG,
             "category_name": p.category.COD_NAME if p.category else ""} for p in prods]

@router.get("/all")
def get_all_products(current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    prods = db.query(Product).all()
    return [{"id": p.ID_PRODUCT, "id_category": p.ID_CATEGORY, "des_product": p.DES_PRODUCT,
             "def_product": p.DEF_PRODUCT, "cod_value": float(p.COD_VALUE), "cod_iva": float(p.COD_IVA),
             "img_product": p.IMG_PRODUCT, "status": p.STATUS, "cod_tag": p.COD_TAG,
             "category_name": p.category.COD_NAME if p.category else ""} for p in prods]

@router.post("")
def create_product(body: ProductCreate, current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    if not db.query(Category).filter(Category.ID_CATEGORY == body.id_category).first():
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    prod = Product(ID_CATEGORY=body.id_category, DES_PRODUCT=body.des_product,
                   DEF_PRODUCT=body.def_product, COD_VALUE=body.cod_value,
                   COD_IVA=body.cod_iva, IMG_PRODUCT=body.img_product, STATUS=body.status,COD_TAG=body.cod_tag)
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return {"message": "Producto creado", "id": prod.ID_PRODUCT}

@router.put("/{id}")
def update_product(id: int, body: ProductUpdate, current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.ID_PRODUCT == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if body.id_category is not None: prod.ID_CATEGORY = body.id_category
    if body.des_product is not None: prod.DES_PRODUCT = body.des_product
    if body.def_product is not None: prod.DEF_PRODUCT = body.def_product
    if body.cod_value is not None: prod.COD_VALUE = body.cod_value
    if body.cod_iva is not None: prod.COD_IVA = body.cod_iva
    if body.img_product is not None: prod.IMG_PRODUCT = body.img_product
    if body.status is not None: prod.STATUS = body.status
    if body.cod_tag is not None: prod.COD_TAG = body.cod_tag
    db.commit()
    return {"message": "Producto actualizado"}

@router.delete("/{id}")
def delete_product(id: int, current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.ID_PRODUCT == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    from models.cart import CartItem
    db.query(CartItem).filter(CartItem.ID_PRODUCT == id).delete()

    db.delete(prod)
    db.commit()
    return {"message": "Producto eliminado"}