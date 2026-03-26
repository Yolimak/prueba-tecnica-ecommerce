from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal
from models import User
from auth import hash_password
from routers import auth_router, categories_router, products_router,cart_router
from routers import auth_router, categories_router, products_router, cart_router, orders_router
app = FastAPI(title="ShopNova API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── INIT ADMIN ────────────────────────────────────────────────────────
def init_db():
    db = SessionLocal()
    user = db.query(User).filter(User.DEF_USER == "admin").first()
    if not user:
        db.add(User(DEF_USER="admin", NOMBRE="Administrador", DEF_PASSWORD=hash_password("1234"), ROL="admin", STATUS=1))
        db.commit()
    db.close()

init_db()

# ── RUTAS ─────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(cart_router)

app.include_router(orders_router)

@app.get("/")
def root():
    return {"message": "ShopNova API v1.0.0", "docs": "/docs"}
