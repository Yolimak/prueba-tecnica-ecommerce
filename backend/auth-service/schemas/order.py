from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CreateOrderRequest(BaseModel):
    def_address: str
    cod_payment: str
    notes: Optional[str] = None

class UpdateOrderStatus(BaseModel):
    status: int