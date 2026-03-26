from sqlalchemy import Column, Integer, String, SmallInteger, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "PRODUCTS"
    ID_PRODUCT  = Column(Integer, primary_key=True, index=True)
    ID_CATEGORY = Column(Integer, ForeignKey("CATEGORIES.ID_CATEGORY"), nullable=False)
    DES_PRODUCT = Column(String(150), nullable=False)
    DEF_PRODUCT = Column(String(500))
    COD_VALUE   = Column(Numeric(12, 2), nullable=False)
    COD_IVA     = Column(Numeric(5, 2), nullable=False, default=19.00)
    IMG_PRODUCT = Column(Text)
    STATUS      = Column(SmallInteger, nullable=False, default=1)
    category    = relationship("Category", back_populates="products")
    COD_TAG = Column(SmallInteger, nullable=False, default=1)