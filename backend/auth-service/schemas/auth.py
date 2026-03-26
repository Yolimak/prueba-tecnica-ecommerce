from pydantic import BaseModel

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