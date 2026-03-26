from sqlalchemy import Column, Integer, String, SmallInteger
from sqlalchemy.orm import relationship
from database import Base

class Category(Base):
    __tablename__ = "CATEGORIES"
    ID_CATEGORY  = Column(Integer, primary_key=True, index=True)
    COD_NAME     = Column(String(100), nullable=False)
    DES_CATEGORY = Column(String(255))
    STATUS       = Column(SmallInteger, nullable=False, default=1)
    products     = relationship("Product", back_populates="category")