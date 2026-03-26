from fastapi import APIRouter, HTTPException, Form, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas.auth import RegisterRequest, AdminRegisterRequest
from auth import hash_password, verify_password, create_token, require_admin, require_admin_or_mod

router = APIRouter(prefix="/auth", tags=["Auth"])

def init_admin(db: Session):
    user = db.query(User).filter(User.DEF_USER == "admin").first()
    if not user:
        db.add(User(DEF_USER="admin", NOMBRE="Administrador", DEF_PASSWORD=hash_password("1234"), ROL="admin", STATUS=1))
        db.commit()

@router.post("/login")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.DEF_USER == username).first()
    if not user or not verify_password(password, user.DEF_PASSWORD):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if user.STATUS == 0:
        raise HTTPException(status_code=403, detail="Usuario inactivo. Contacta al administrador.")
    token = create_token({"sub": user.DEF_USER, "rol": user.ROL, "nombre": user.NOMBRE})
    return {"access_token": token, "rol": user.ROL, "username": user.DEF_USER, "nombre": user.NOMBRE}

@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if body.rol in ["admin", "moderador"]:
        raise HTTPException(status_code=403, detail="No puedes registrarte con ese rol.")
    if len(body.nombre.strip()) < 2:
        raise HTTPException(status_code=400, detail="El nombre debe tener al menos 2 caracteres")
    if len(body.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="El usuario debe tener al menos 3 caracteres")
    if len(body.password) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres")
    if db.query(User).filter(User.DEF_USER == body.username).first():
        raise HTTPException(status_code=409, detail="El usuario ya existe")
    
    # Crear usuario
    new_user = User(DEF_USER=body.username, NOMBRE=body.nombre, 
                    DEF_PASSWORD=hash_password(body.password), ROL="cliente", STATUS=1)
    db.add(new_user)
    db.flush()  # ← obtiene el ID sin hacer commit
    
    # Crear carrito automáticamente
    from models.cart import Cart
    cart = Cart(ID_USER=new_user.ID_USER, STATUS=1)
    db.add(cart)
    db.commit()
    
    return {"message": "Usuario registrado exitosamente", "username": body.username, "nombre": body.nombre}

@router.post("/admin/register")
def admin_register(body: AdminRegisterRequest, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    ROLES_VALIDOS = ["admin", "cliente", "moderador"]
    if body.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Usa: {ROLES_VALIDOS}")
    if len(body.nombre.strip()) < 2:
        raise HTTPException(status_code=400, detail="El nombre debe tener al menos 2 caracteres")
    if len(body.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="El usuario debe tener al menos 3 caracteres")
    if len(body.password) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres")
    if db.query(User).filter(User.DEF_USER == body.username).first():
        raise HTTPException(status_code=409, detail="El usuario ya existe")
    db.add(User(DEF_USER=body.username, NOMBRE=body.nombre, DEF_PASSWORD=hash_password(body.password), ROL=body.rol, STATUS=1))
    db.commit()
    return {"message": f"Usuario '{body.username}' creado con rol '{body.rol}'"}
@router.get("/users")
def get_all_users(current_user: dict = Depends(require_admin_or_mod), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.ID_USER).all()
    return [{
        "id": u.ID_USER, "username": u.DEF_USER, "nombre": u.NOMBRE,
        "rol": u.ROL, "status": u.STATUS
    } for u in users]

@router.put("/users/{user_id}/status")
def toggle_user_status(user_id: int, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.ID_USER == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.DEF_USER == current_user["username"]:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")
    user.STATUS = 0 if user.STATUS == 1 else 1
    db.commit()
    return {"message": "Estado actualizado", "status": user.STATUS}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.ID_USER == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.DEF_USER == current_user["username"]:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    if user.ROL == "admin":
        raise HTTPException(status_code=403, detail="No puedes eliminar otro admin")

    from models.cart import Cart, CartItem
    from models.order import Order, OrderItem

    carts = db.query(Cart).filter(Cart.ID_USER == user_id).all()
    for cart in carts:
        db.query(CartItem).filter(CartItem.ID_CART == cart.ID_CART).delete()
    db.query(Cart).filter(Cart.ID_USER == user_id).delete()

    orders = db.query(Order).filter(Order.ID_USER == user_id).all()
    for order in orders:
        db.query(OrderItem).filter(OrderItem.ID_ORDER == order.ID_ORDER).delete()
    db.query(Order).filter(Order.ID_USER == user_id).delete()

    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado"}