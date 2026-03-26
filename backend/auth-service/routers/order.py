from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import random, string
from database import get_db
from models import User
from models.cart import Cart, CartItem
from models.product import Product
from models.order import Order, OrderItem
from auth import get_current_user, require_admin_or_mod
from schemas.order import UpdateOrderStatus,CreateOrderRequest

router = APIRouter(prefix="/orders", tags=["Orders"])

STATUS_MAP = {
    1: "Pendiente de pago",
    2: "Confirmado",
    3: "Enviado",
    4: "Entregado",
    5: "Cancelado"
}

PAYMENT_MAP = {
    "efectivo": "Efectivo",
    "tarjeta_credito": "Tarjeta de crédito",
    "tarjeta_debito": "Tarjeta de débito",
    "transferencia": "Transferencia bancaria"
}



def generate_order_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "ORD-" + "".join(random.choices(chars, k=8))

def build_order_response(order: Order) -> dict:
    return {
        "id_order": order.ID_ORDER,
        "cod_order": order.COD_ORDER,
        "status": order.STATUS,
        "status_label": STATUS_MAP.get(order.STATUS, "Desconocido"),
        "def_address": order.DEF_ADDRESS,
        "cod_payment": order.COD_PAYMENT,
        "payment_label": PAYMENT_MAP.get(order.COD_PAYMENT, order.COD_PAYMENT),
        "subtotal": float(order.SUBTOTAL),
        "total_iva": float(order.TOTAL_IVA),
        "total": float(order.TOTAL),
        "notes": order.NOTES,
        "created_at": order.CREATED_AT.isoformat() if order.CREATED_AT else "",
        "updated_at": order.UPDATED_AT.isoformat() if order.UPDATED_AT else "",
        "items": [{
            "id_item": i.ID_ITEM,
            "id_product": i.ID_PRODUCT,
            "des_product": i.DES_PRODUCT,
            "quantity": i.QUANTITY,
            "cod_value": float(i.COD_VALUE),
            "cod_iva": float(i.COD_IVA),
            "subtotal_item": float(i.SUBTOTAL_ITEM),
            "iva_item": float(i.IVA_ITEM),
            "total_item": float(i.TOTAL_ITEM),
        } for i in order.items]
    }


@router.post("")
def create_order(body: CreateOrderRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not body.def_address.strip():
        raise HTTPException(status_code=400, detail="La dirección de envío es requerida")
    if body.cod_payment not in PAYMENT_MAP:
        raise HTTPException(status_code=400, detail=f"Método de pago inválido. Opciones: {list(PAYMENT_MAP.keys())}")

    user = db.query(User).filter(User.DEF_USER == current_user["username"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    cart = db.query(Cart).filter(Cart.ID_USER == user.ID_USER, Cart.STATUS == 1).first()
    if not cart:
        raise HTTPException(status_code=404, detail="No tienes un carrito activo")

    cart_items = db.query(CartItem).filter(CartItem.ID_CART == cart.ID_CART).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    # Calcular totales
    subtotal = 0.0
    total_iva = 0.0
    order_items_data = []

    for ci in cart_items:
        product = db.query(Product).filter(Product.ID_PRODUCT == ci.ID_PRODUCT).first()
        if not product:
            continue
        if product.STATUS == 2:
            raise HTTPException(status_code=400, detail=f"El producto '{product.DES_PRODUCT}' está agotado")

        val = float(ci.COD_VALUE)
        iva = float(ci.COD_IVA)
        qty = ci.QUANTITY
        sub = val * qty
        iva_item = sub * (iva / 100)
        total_item = sub + iva_item

        subtotal += sub
        total_iva += iva_item
        order_items_data.append({
            "id_product": ci.ID_PRODUCT,
            "des_product": product.DES_PRODUCT,
            "quantity": qty,
            "cod_value": val,
            "cod_iva": iva,
            "subtotal_item": round(sub, 2),
            "iva_item": round(iva_item, 2),
            "total_item": round(total_item, 2),
        })

    total = subtotal + total_iva

    # Generar código único
    cod_order = generate_order_code()
    while db.query(Order).filter(Order.COD_ORDER == cod_order).first():
        cod_order = generate_order_code()

    # Crear pedido
    order = Order(
        ID_USER=user.ID_USER,
        COD_ORDER=cod_order,
        STATUS=1,
        DEF_ADDRESS=body.def_address,
        COD_PAYMENT=body.cod_payment,
        SUBTOTAL=round(subtotal, 2),
        TOTAL_IVA=round(total_iva, 2),
        TOTAL=round(total, 2),
        NOTES=body.notes
    )
    db.add(order)
    db.flush()

    # Crear items del pedido
    for item_data in order_items_data:
        oi = OrderItem(
            ID_ORDER=order.ID_ORDER,
            ID_PRODUCT=item_data["id_product"],
            DES_PRODUCT=item_data["des_product"],
            QUANTITY=item_data["quantity"],
            COD_VALUE=item_data["cod_value"],
            COD_IVA=item_data["cod_iva"],
            SUBTOTAL_ITEM=item_data["subtotal_item"],
            IVA_ITEM=item_data["iva_item"],
            TOTAL_ITEM=item_data["total_item"],
        )
        db.add(oi)

    # Vaciar carrito
    db.query(CartItem).filter(CartItem.ID_CART == cart.ID_CART).delete()
    db.commit()
    db.refresh(order)

    return build_order_response(order)


@router.get("/my")
def get_my_orders(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.DEF_USER == current_user["username"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    orders = db.query(Order).filter(Order.ID_USER == user.ID_USER).order_by(Order.CREATED_AT.desc()).all()
    return [build_order_response(o) for o in orders]


@router.get("/all")
def get_all_orders(current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.CREATED_AT.desc()).all()
    result = []
    for o in orders:
        user = db.query(User).filter(User.ID_USER == o.ID_USER).first()
        data = build_order_response(o)
        data["username"] = user.DEF_USER if user else ""
        data["nombre"] = user.NOMBRE if user else ""
        result.append(data)
    return result


@router.put("/{id_order}/status")
def update_order_status(id_order: int, body: UpdateOrderStatus, current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    if body.status not in STATUS_MAP:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {list(STATUS_MAP.keys())}")
    order = db.query(Order).filter(Order.ID_ORDER == id_order).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order.STATUS = body.status
    db.commit()
    return {"message": "Estado actualizado", "status": body.status, "status_label": STATUS_MAP[body.status]}


@router.get("/{id_order}")
def get_order(id_order: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.ID_ORDER == id_order).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    user = db.query(User).filter(User.DEF_USER == current_user["username"]).first()
    if current_user["rol"] not in ["admin", "moderador"] and order.ID_USER != user.ID_USER:
        raise HTTPException(status_code=403, detail="No tienes acceso a este pedido")
    return build_order_response(order)