from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import os

from app.database import get_db
from app.models.user import User
from app.models.calculation import Calculation
from app.schemas.calculation import CalculationRequest, CalculationResponse

router  = APIRouter(prefix="/calculations", tags=["calculations"])
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-2024")
ALGORITHM  = "HS256"

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def do_calculation(calc_type: str, inputs: list) -> float:
    if not inputs:
        raise HTTPException(status_code=400, detail="inputs cannot be empty")
    t = calc_type.lower()
    if t == "add":
        return sum(inputs)
    elif t == "subtract":
        result = inputs[0]
        for n in inputs[1:]:
            result -= n
        return result
    elif t == "multiply":
        result = 1.0
        for n in inputs:
            result *= n
        return result
    elif t == "divide":
        result = inputs[0]
        for n in inputs[1:]:
            if n == 0:
                raise HTTPException(status_code=400, detail="Division by zero")
            result /= n
        return result
    else:
        raise HTTPException(status_code=400, detail=f"Unknown type: {calc_type}")


@router.post("", response_model=CalculationResponse, status_code=201)
def create_calculation(
    payload: CalculationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = do_calculation(payload.type, payload.inputs)
    calc = Calculation(
        user_id=current_user.id,
        type=payload.type,
        inputs=payload.inputs,
        result=result
    )
    db.add(calc)
    db.commit()
    return CalculationResponse(result=result, type=payload.type, inputs=payload.inputs)
