from pydantic import BaseModel
from typing import Optional

class CategoryCreate(BaseModel):
    cod_name: str
    des_category: Optional[str] = None
    

class CategoryUpdate(BaseModel):
    cod_name: Optional[str] = None
    des_category: Optional[str] = None
    status: Optional[int] = None