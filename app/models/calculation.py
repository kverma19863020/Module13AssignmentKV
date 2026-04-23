from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base

class Calculation(Base):
    __tablename__ = "calculations"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    type       = Column(String, nullable=False)
    inputs     = Column(JSON, nullable=False)
    result     = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
