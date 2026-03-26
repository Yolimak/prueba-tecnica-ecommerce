from sqlalchemy import Column, Integer, SmallInteger, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Cart(Base):
    __tablename__ = "CART"
    ID_CART    = Column(Integer, primary_key=True, index=True)
    ID_USER    = Column(Integer, ForeignKey("USERS.ID_USER"), nullable=False)
    STATUS     = Column(SmallInteger, nullable=False, default=1)
    CREATED_AT = Column(DateTime, default=func.now())
    UPDATED_AT = Column(DateTime, default=func.now(), onupdate=func.now())
    items      = relationship("CartItem", back_populates="cart")

class CartItem(Base):
    __tablename__ = "CART_ITEMS"
    ID_ITEM    = Column(Integer, primary_key=True, index=True)
    ID_CART    = Column(Integer, ForeignKey("CART.ID_CART"), nullable=False)
    ID_PRODUCT = Column(Integer, ForeignKey("PRODUCTS.ID_PRODUCT"), nullable=False)
    QUANTITY   = Column(Integer, nullable=False, default=1)
    COD_VALUE  = Column(Numeric(12, 2), nullable=False)
    COD_IVA    = Column(Numeric(5, 2), nullable=False, default=19.00)
    cart       = relationship("Cart", back_populates="items")
    product    = relationship("Product")