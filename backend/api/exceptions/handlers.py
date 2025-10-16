"""
Exception handlers for API
"""
from ninja import NinjaAPI
from .base_exception import APIException


def register_exception_handlers(api: NinjaAPI):
    """
    Register custom exception handlers
    """
    @api.exception_handler(APIException)
    def handle_api_exception(request, exc: APIException):
        return api.create_response(
            request,
            {
                "success": False,
                "message": exc.message,
                "errors": None
            },
            status=exc.status_code
        )

    @api.exception_handler(Exception)
    def handle_generic_exception(request, exc: Exception):
        return api.create_response(
            request,
            {
                "success": False,
                "message": "Internal server error",
                "errors": str(exc)
            },
            status=500
        )
