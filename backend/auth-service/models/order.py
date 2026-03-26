from sqlalchemy import Column, Integer, String, SmallInteger, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Order(Base):
    __tablename__ = "ORDERS"
    ID_ORDER    = Column(Integer, primary_key=True, index=True)
    ID_USER     = Column(Integer, ForeignKey("USERS.ID_USER"), nullable=False)
    COD_ORDER   = Column(String(20), unique=True, nullable=False)
    STATUS      = Column(SmallInteger, nullable=False, default=1)
    DEF_ADDRESS = Column(String(255), nullable=False)
    COD_PAYMENT = Column(String(50), nullable=False)
    SUBTOTAL    = Column(Numeric(12,2), nullable=False)
    TOTAL_IVA   = Column(Numeric(12,2), nullable=False)
    TOTAL       = Column(Numeric(12,2), nullable=False)
    NOTES       = Column(String(500))
    CREATED_AT  = Column(DateTime, default=func.now())
    UPDATED_AT  = Column(DateTime, default=func.now(), onupdate=func.now())
    items       = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "ORDER_ITEMS"
    ID_ITEM       = Column(Integer, primary_key=True, index=True)
    ID_ORDER      = Column(Integer, ForeignKey("ORDERS.ID_ORDER"), nullable=False)
    ID_PRODUCT    = Column(Integer, ForeignKey("PRODUCTS.ID_PRODUCT"), nullable=False)
    DES_PRODUCT   = Column(String(150), nullable=False)
    QUANTITY      = Column(Integer, nullable=False)
    COD_VALUE     = Column(Numeric(12,2), nullable=False)
    COD_IVA       = Column(Numeric(5,2), nullable=False)
    SUBTOTAL_ITEM = Column(Numeric(12,2), nullable=False)
    IVA_ITEM      = Column(Numeric(12,2), nullable=False)
    TOTAL_ITEM    = Column(Numeric(12,2), nullable=False)
    order         = relationship("Order", back_populates="items")