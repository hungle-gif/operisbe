"""
Custom exceptions for API
"""


class APIException(Exception):
    """Base API Exception"""
    status_code = 400
    default_message = "An error occurred"

    def __init__(self, message: str = None, status_code: int = None):
        self.message = message or self.default_message
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)


class ValidationException(APIException):
    """Validation error"""
    status_code = 422
    default_message = "Validation error"


class NotFoundException(APIException):
    """Resource not found"""
    status_code = 404
    default_message = "Resource not found"


class UnauthorizedException(APIException):
    """Unauthorized access"""
    status_code = 401
    default_message = "Unauthorized"


class ForbiddenException(APIException):
    """Forbidden access"""
    status_code = 403
    default_message = "Forbidden"


class ConflictException(APIException):
    """Resource conflict"""
    status_code = 409
    default_message = "Resource conflict"
