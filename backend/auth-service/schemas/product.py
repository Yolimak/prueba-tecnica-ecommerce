from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    id_category: int
    des_product: str
    def_product: Optional[str] = None
    cod_value: float
    cod_iva: float = 19.00
    img_product: Optional[str] = None
    status: int = 1
    cod_tag: int = 1  
class ProductUpdate(BaseModel):
    id_category: Optional[int] = None
    des_product: Optional[str] = None
    def_product: Optional[str] = None
    cod_value: Optional[float] = None
    cod_iva: Optional[float] = None
    img_product: Optional[str] = None
    status: Optional[int] = None
    cod_tag: Optional[int] = None