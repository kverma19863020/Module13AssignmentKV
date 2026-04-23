from pydantic import BaseModel
from typing import List

class CalculationRequest(BaseModel):
    type: str
    inputs: List[float]

class CalculationResponse(BaseModel):
    result: float
    type: str
    inputs: List[float]
