"""
Standardized API response format
"""
from typing import Any, Optional
from pydantic import BaseModel


class APIResponse(BaseModel):
    """
    Standard API response format
    """
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
    errors: Optional[Any] = None

    @classmethod
    def success_response(cls, data: Any = None, message: str = "Success"):
        """Create success response"""
        return cls(
            success=True,
            message=message,
            data=data
        )

    @classmethod
    def error_response(cls, message: str = "Error", errors: Any = None):
        """Create error response"""
        return cls(
            success=False,
            message=message,
            errors=errors
        )
