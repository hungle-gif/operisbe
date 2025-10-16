"""
Project Acceptance & Feedback API
Customer submits acceptance decision after all phases are paid
"""
from typing import List
from ninja import Router
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from api.dependencies.current_user import auth_bearer
from apps.projects.models import Project, ProjectStatus, ProjectFeedback
from apps.projects.schemas.feedback_schema import (
    AcceptanceSubmit,
    FeedbackOut,
    AdminResponse,
    RevisionComplete
)

router = Router(tags=['Acceptance & Feedback'])


def serialize_feedback(feedback):
    """Helper to serialize feedback with proper formatting"""
    return {
        'id': str(feedback.id),
        'project_id': str(feedback.project.id),
        'customer': {
            'id': str(feedback.customer.id),
            'full_name': feedback.customer.full_name,
            'email': feedback.customer.email
        },
        'acceptance_status': feedback.acceptance_status,
        'accepted_at': feedback.accepted_at.isoformat() if feedback.accepted_at else None,
        'rejected_at': feedback.rejected_at.isoformat() if feedback.rejected_at else None,
        'rating': feedback.rating,
        'feedback': feedback.feedback,
        'complaint': feedback.complaint,
        'revision_details': feedback.revision_details,
        'feature_request': feedback.feature_request,
        'upgrade_request': feedback.upgrade_request,
        'admin_response': feedback.admin_response,
        'admin_responded_at': feedback.admin_responded_at.isoformat() if feedback.admin_responded_at else None,
        'responded_by': {
            'id': str(feedback.responded_by.id),
            'full_name': feedback.responded_by.full_name,
            'email': feedback.responded_by.email
        } if feedback.responded_by else None,
        'revision_completed': feedback.revision_completed,
        'revision_completed_at': feedback.revision_completed_at.isoformat() if feedback.revision_completed_at else None,
        'created_at': feedback.created_at.isoformat(),
        'updated_at': feedback.updated_at.isoformat()
    }


@router.post("/projects/{project_id}/acceptance", response=FeedbackOut, auth=auth_bearer)
def submit_acceptance(request, project_id: str, payload: AcceptanceSubmit):
    """
    Customer submits acceptance decision for completed project

    Flow:
    1. Project status must be PENDING_ACCEPTANCE (all phases paid)
    2. Customer reviews and decides:
       - ACCEPT → Project = COMPLETED, can rate & give feedback
       - REJECT → Project = REVISION_REQUIRED, must provide revision details
    3. Can only submit once per project (can update before final decision)

    Requirements:
    - If accepting: rating is required
    - If rejecting: complaint or revision_details required
    """
    user = request.auth
    project = get_object_or_404(Project, id=project_id)

    # Must be customer of the project
    if user.role != 'customer' or project.customer.user != user:
        raise HttpError(403, "Not authorized")

    # Project must be PENDING_ACCEPTANCE or REVISION_REQUIRED
    if project.status not in [ProjectStatus.PENDING_ACCEPTANCE, ProjectStatus.REVISION_REQUIRED]:
        raise HttpError(400, f"Project must be pending acceptance. Current status: {project.status}")

    # Validation based on decision
    if payload.acceptance_status == 'accepted':
        if not payload.rating:
            raise HttpError(400, "Rating is required when accepting the project")
        if payload.rating < 1 or payload.rating > 5:
            raise HttpError(400, "Rating must be between 1 and 5")
    elif payload.acceptance_status == 'rejected':
        if not payload.complaint and not payload.revision_details:
            raise HttpError(400, "Complaint or revision details required when rejecting")

    # Check if feedback already exists (allow updating before final acceptance)
    existing_feedback = ProjectFeedback.objects.filter(
        project=project,
        customer=user
    ).first()

    now = timezone.now()

    if existing_feedback:
        # Update existing feedback
        existing_feedback.acceptance_status = payload.acceptance_status
        existing_feedback.feedback = payload.feedback
        existing_feedback.rating = payload.rating
        existing_feedback.complaint = payload.complaint
        existing_feedback.revision_details = payload.revision_details
        existing_feedback.feature_request = payload.feature_request
        existing_feedback.upgrade_request = payload.upgrade_request

        if payload.acceptance_status == 'accepted':
            existing_feedback.accepted_at = now
            existing_feedback.rejected_at = None
        else:
            existing_feedback.rejected_at = now
            existing_feedback.accepted_at = None

        existing_feedback.save()
        feedback = existing_feedback
    else:
        # Create new feedback
        feedback = ProjectFeedback.objects.create(
            project=project,
            customer=user,
            acceptance_status=payload.acceptance_status,
            feedback=payload.feedback,
            rating=payload.rating,
            complaint=payload.complaint,
            revision_details=payload.revision_details,
            feature_request=payload.feature_request,
            upgrade_request=payload.upgrade_request,
            accepted_at=now if payload.acceptance_status == 'accepted' else None,
            rejected_at=now if payload.acceptance_status == 'rejected' else None
        )

    # Update project status based on decision
    if payload.acceptance_status == 'accepted':
        project.status = ProjectStatus.COMPLETED
        project.end_date = now.date()
    else:
        project.status = ProjectStatus.REVISION_REQUIRED

    project.save()

    return serialize_feedback(feedback)


@router.get("/projects/{project_id}/acceptance", response=FeedbackOut, auth=auth_bearer)
def get_acceptance_status(request, project_id: str):
    """
    Get acceptance/feedback for a project
    Customer: their own feedback
    Sales/Admin: project feedback
    """
    user = request.auth
    project = get_object_or_404(Project, id=project_id)

    # Check permissions
    if user.role == 'customer':
        if project.customer.user != user:
            raise HttpError(403, "Not authorized")

    feedback = ProjectFeedback.objects.filter(project=project).first()

    if not feedback:
        raise HttpError(404, "No acceptance submission found for this project")

    return serialize_feedback(feedback)


@router.post("/acceptance/{feedback_id}/complete-revision", response=FeedbackOut, auth=auth_bearer)
def complete_revision(request, feedback_id: str, payload: RevisionComplete):
    """
    Sales/Admin marks revision as completed
    Changes project status back to PENDING_ACCEPTANCE for customer to review again
    """
    user = request.auth

    if user.role not in ['admin', 'sales']:
        raise HttpError(403, "Only admin or sales can mark revision as complete")

    feedback = get_object_or_404(ProjectFeedback, id=feedback_id)

    if feedback.acceptance_status != 'rejected':
        raise HttpError(400, "Revision completion only applies to rejected acceptances")

    # Mark revision as completed
    now = timezone.now()
    feedback.revision_completed = True
    feedback.revision_completed_at = now
    feedback.admin_response = payload.admin_response
    feedback.admin_responded_at = now
    feedback.responded_by = user
    feedback.save()

    # Change project status back to PENDING_ACCEPTANCE
    feedback.project.status = ProjectStatus.PENDING_ACCEPTANCE
    feedback.project.save()

    return serialize_feedback(feedback)


@router.post("/acceptance/{feedback_id}/respond", response=FeedbackOut, auth=auth_bearer)
def respond_to_feedback(request, feedback_id: str, payload: AdminResponse):
    """
    Admin/Sales responds to customer feedback (after acceptance)
    """
    user = request.auth

    if user.role not in ['admin', 'sales']:
        raise HttpError(403, "Only admin or sales can respond")

    feedback = get_object_or_404(ProjectFeedback, id=feedback_id)

    now = timezone.now()
    feedback.admin_response = payload.admin_response
    feedback.admin_responded_at = now
    feedback.responded_by = user
    feedback.save()

    return serialize_feedback(feedback)


@router.get("/acceptance/all", response=List[FeedbackOut], auth=auth_bearer)
def list_all_acceptances(request):
    """
    List all project acceptances (Admin/Sales only)
    Used for admin dashboard
    """
    user = request.auth

    if user.role not in ['admin', 'sales']:
        raise HttpError(403, "Admin/Sales only")

    feedbacks = ProjectFeedback.objects.all().select_related(
        'customer', 'responded_by', 'project'
    ).order_by('-created_at')

    return [serialize_feedback(f) for f in feedbacks]
