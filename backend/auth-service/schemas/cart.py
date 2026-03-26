from pydantic import BaseModel
from typing import Optional

class AddItemRequest(BaseModel):
    id_product: int
    quantity: int = 1

class UpdateItemRequest(BaseModel):
    quantity: int