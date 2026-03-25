from fastapi import FastAPI, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, SmallInteger
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel

DATABASE_URL = "mysql+pymysql://appuser:app123@localhost:3306/ecommerce"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "secret123"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
bearer_scheme = HTTPBearer()


class User(Base):
    __tablename__ = "USERS"
    ID_USER      = Column(Integer, primary_key=True, index=True)
    DEF_USER     = Column(String(50), unique=True, nullable=False)
    NOMBRE       = Column(String(100), nullable=False, default="")
    DEF_PASSWORD = Column(String(255), nullable=False)
    ROL          = Column(String(20), nullable=False, default="cliente")
    STATUS       = Column(SmallInteger, nullable=False, default=1)


class RegisterRequest(BaseModel):
    nombre: str
    username: str
    password: str
    rol: str = "cliente"


class AdminRegisterRequest(BaseModel):
    nombre: str
    username: str
    password: str
    rol: str = "cliente"


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return {"username": payload.get("sub"), "rol": payload.get("rol"), "nombre": payload.get("nombre")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


def init_db():
    db: Session = SessionLocal()
    user = db.query(User).filter(User.DEF_USER == "admin").first()
    if not user:
        hashed = pwd_context.hash("1234")
        db.add(User(DEF_USER="admin", NOMBRE="Administrador", DEF_PASSWORD=hashed, ROL="admin", STATUS=1))
        db.commit()
    db.close()

init_db()


@app.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    db: Session = SessionLocal()
    user = db.query(User).filter(User.DEF_USER == username).first()

    if not user or not pwd_context.verify(password, user.DEF_PASSWORD):
        db.close()
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if user.STATUS == 0:
        db.close()
        raise HTTPException(status_code=403, detail="Usuario inactivo. Contacta al administrador.")

    token = jwt.encode(
        {"sub": user.DEF_USER, "rol": user.ROL, "nombre": user.NOMBRE},
        SECRET_KEY, algorithm=ALGORITHM
    )
    db.close()
    return {"access_token": token, "rol": user.ROL, "username": user.DEF_USER, "nombre": user.NOMBRE}


@app.post("/register")
def register(body: RegisterRequest):
    ROLES_PRIVILEGIADOS = ["admin", "moderador"]

    if body.rol in ROLES_PRIVILEGIADOS:
        raise HTTPException(status_code=403, detail="No puedes registrarte con ese rol.")
    if len(body.nombre.strip()) < 2:
        raise HTTPException(status_code=400, detail="El nombre debe tener al menos 2 caracteres")
    if len(body.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="El usuario debe tener al menos 3 caracteres")
    if len(body.password) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres")

    db: Session = SessionLocal()
    if db.query(User).filter(User.DEF_USER == body.username).first():
        db.close()
        raise HTTPException(status_code=409, detail="El usuario ya existe")

    hashed = pwd_context.hash(body.password)
    db.add(User(DEF_USER=body.username, NOMBRE=body.nombre, DEF_PASSWORD=hashed, ROL="cliente", STATUS=1))
    db.commit()
    db.close()
    return {"message": "Usuario registrado exitosamente", "username": body.username, "nombre": body.nombre}


@app.post("/admin/register")
def admin_register(body: AdminRegisterRequest, current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador puede crear estos usuarios")

    ROLES_VALIDOS = ["admin", "cliente", "moderador"]
    if body.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Usa: {ROLES_VALIDOS}")
    if len(body.nombre.strip()) < 2:
        raise HTTPException(status_code=400, detail="El nombre debe tener al menos 2 caracteres")
    if len(body.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="El usuario debe tener al menos 3 caracteres")
    if len(body.password) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres")

    db: Session = SessionLocal()
    if db.query(User).filter(User.DEF_USER == body.username).first():
        db.close()
        raise HTTPException(status_code=409, detail="El usuario ya existe")

    hashed = pwd_context.hash(body.password)
    db.add(User(DEF_USER=body.username, NOMBRE=body.nombre, DEF_PASSWORD=hashed, ROL=body.rol, STATUS=1))
    db.commit()
    db.close()
    return {"message": f"Usuario '{body.username}' creado con rol '{body.rol}'"}