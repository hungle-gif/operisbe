"""
Main API configuration
"""
from ninja import NinjaAPI
from .exceptions.handlers import register_exception_handlers
from apps.users.routers.auth_router import router as auth_router
from apps.users.routers.user_router import router as user_router
from apps.services.routers.service_router import router as service_router
from apps.projects.routers import project_router
from apps.projects.routers.project_template_router import router as project_template_router
from apps.projects.routers.proposal_router import router as proposal_router
from apps.projects.routers.feedback_router import router as feedback_router
from apps.projects.routers.finance_router import router as finance_router
from apps.projects.routers.transaction_router import router as transaction_router

# Initialize API
api = NinjaAPI(
    title="Operis API",
    version="1.0.0",
    description="API for Operis - Software Company Management System"
)

# Register exception handlers
register_exception_handlers(api)

# Register routers
api.add_router("/auth", auth_router)
api.add_router("/users", user_router)
api.add_router("/services", service_router)
api.add_router("/projects", project_router)
api.add_router("/project-templates", project_template_router)
api.add_router("", proposal_router)  # Proposal router already has full paths
api.add_router("/feedback", feedback_router)
api.add_router("/finance", finance_router)
api.add_router("/transactions", transaction_router)

# Health check endpoint
@api.get("/health")
def health_check(request):
    return {
        "status": "healthy",
        "version": "1.0.0"
    }
