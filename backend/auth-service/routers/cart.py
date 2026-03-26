from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from models.cart import Cart, CartItem
from models.product import Product
from auth import get_current_user, require_admin_or_mod
from schemas.cart import AddItemRequest,UpdateItemRequest

router = APIRouter(prefix="/cart", tags=["Cart"])


def get_user_cart(db: Session, username: str) -> Cart:
    user = db.query(User).filter(User.DEF_USER == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    cart = db.query(Cart).filter(Cart.ID_USER == user.ID_USER, Cart.STATUS == 1).first()
    if not cart:
        # Crear carrito si no existe
        cart = Cart(ID_USER=user.ID_USER, STATUS=1)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

def build_cart_response(cart: Cart, db: Session) -> dict:
    items = db.query(CartItem).filter(CartItem.ID_CART == cart.ID_CART).all()
    
    cart_items = []
    subtotal = 0.0
    total_iva = 0.0

    for item in items:
        product = db.query(Product).filter(Product.ID_PRODUCT == item.ID_PRODUCT).first()
        if not product:
            continue

        valor_unitario = float(item.COD_VALUE)
        iva_pct = float(item.COD_IVA)
        qty = item.QUANTITY

        subtotal_item = valor_unitario * qty
        iva_item = subtotal_item * (iva_pct / 100)
        total_item = subtotal_item + iva_item

        subtotal += subtotal_item
        total_iva += iva_item

        cart_items.append({
            "id_item": item.ID_ITEM,
            "id_product": item.ID_PRODUCT,
            "des_product": product.DES_PRODUCT,
            "img_product": product.IMG_PRODUCT,
            "category_name": product.category.COD_NAME if product.category else "",
            "quantity": qty,
            "cod_value": valor_unitario,
            "cod_iva": iva_pct,
            "subtotal_item": round(subtotal_item, 2),
            "iva_item": round(iva_item, 2),
            "total_item": round(total_item, 2),
        })

    total = subtotal + total_iva

    return {
        "id_cart": cart.ID_CART,
        "items": cart_items,
        "resumen": {
            "subtotal": round(subtotal, 2),
            "total_iva": round(total_iva, 2),
            "total": round(total, 2),
            "cantidad_items": len(cart_items),
        }
    }

# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@router.get("")
def get_cart(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_user_cart(db, current_user["username"])
    return build_cart_response(cart, db)


@router.post("/add")
def add_item(body: AddItemRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.quantity <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

    product = db.query(Product).filter(Product.ID_PRODUCT == body.id_product).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.STATUS == 2:
        raise HTTPException(status_code=400, detail="Producto agotado")

    cart = get_user_cart(db, current_user["username"])

    #  suma la cantidad
    existing = db.query(CartItem).filter(
        CartItem.ID_CART == cart.ID_CART,
        CartItem.ID_PRODUCT == body.id_product
    ).first()

    if existing:
        existing.QUANTITY += body.quantity
    else:
        item = CartItem(
            ID_CART=cart.ID_CART,
            ID_PRODUCT=body.id_product,
            QUANTITY=body.quantity,
            COD_VALUE=product.COD_VALUE,
            COD_IVA=product.COD_IVA
        )
        db.add(item)

    db.commit()
    return build_cart_response(cart, db)

@router.put("/item/{id_item}")
def update_item(id_item: int, body: UpdateItemRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.quantity <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

    cart = get_user_cart(db, current_user["username"])
    item = db.query(CartItem).filter(
        CartItem.ID_ITEM == id_item,
        CartItem.ID_CART == cart.ID_CART
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado en el carrito")

    item.QUANTITY = body.quantity
    db.commit()
    return build_cart_response(cart, db)

@router.delete("/item/{id_item}")
def remove_item(id_item: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_user_cart(db, current_user["username"])
    item = db.query(CartItem).filter(
        CartItem.ID_ITEM == id_item,
        CartItem.ID_CART == cart.ID_CART
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    db.delete(item)
    db.commit()
    return build_cart_response(cart, db)

@router.delete("/clear")
def clear_cart(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_user_cart(db, current_user["username"])
    db.query(CartItem).filter(CartItem.ID_CART == cart.ID_CART).delete()
    db.commit()
    return {"message": "Carrito vaciado", "id_cart": cart.ID_CART, "items": [], "resumen": {"subtotal": 0, "total_iva": 0, "total": 0, "cantidad_items": 0}}

@router.get("/all")
def get_all_carts(current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    carts = db.query(Cart).filter(Cart.STATUS == 1).all()
    result = []
    for cart in carts:
        user = db.query(User).filter(User.ID_USER == cart.ID_USER).first()
        data = build_cart_response(cart, db)
        data["username"] = user.DEF_USER if user else ""
        data["nombre"] = user.NOMBRE if user else ""
        data["user_id"] = cart.ID_USER
        data["updated_at"] = cart.UPDATED_AT.isoformat() if cart.UPDATED_AT else ""
        result.append(data)
    return [r for r in result if r["resumen"]["cantidad_items"] > 0]

@router.delete("/admin/{id_cart}")
def admin_clear_cart(id_cart: int, current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.ID_CART == id_cart).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Carrito no encontrado")
    db.query(CartItem).filter(CartItem.ID_CART == id_cart).delete()
    db.commit()
    return {"message": "Carrito vaciado"}