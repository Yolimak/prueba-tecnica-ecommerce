from sqlalchemy import Column, Integer, String, SmallInteger
from database import Base

class User(Base):
    __tablename__ = "USERS"
    ID_USER      = Column(Integer, primary_key=True, index=True)
    DEF_USER     = Column(String(50), unique=True, nullable=False)
    NOMBRE       = Column(String(100), nullable=False, default="")
    DEF_PASSWORD = Column(String(255), nullable=False)
    ROL          = Column(String(20), nullable=False, default="cliente")
    STATUS       = Column(SmallInteger, nullable=False, default=1)