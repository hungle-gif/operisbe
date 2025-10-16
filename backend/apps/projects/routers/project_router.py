"""
Project API endpoints
"""
from uuid import UUID
from typing import List
from ninja import Router
from django.utils import timezone
from apps.projects.models import Project, ChatMessage, ChatParticipant
from apps.projects.schemas.project_schema import (
    ProjectOut, ProjectListOut, ChatMessageOut, ChatMessageCreate
)
from api.dependencies.current_user import auth_bearer
from core.responses.api_response import APIResponse

router = Router(tags=['Projects'])


@router.get("", response=List[ProjectListOut], auth=auth_bearer)
def list_projects(request, status: str = None):
    """List projects for current user"""
    user = request.auth

    if user.is_customer:
        # Customer sees their own projects
        queryset = Project.objects.filter(customer__user=user)
    elif user.role in ['sales', 'admin']:
        # Sales/Admin see projects they manage
        queryset = Project.objects.filter(project_manager=user)
    else:
        # Developers see projects they're assigned to
        queryset = Project.objects.filter(team_members=user)

    if status:
        queryset = queryset.filter(status=status)

    projects = queryset.select_related('customer__user', 'project_manager').distinct()

    # Manually serialize to match schema
    result = []
    for project in projects:
        result.append({
            'id': project.id,
            'name': project.name,
            'status': project.status,
            'priority': project.priority,
            'customer': {
                'id': project.customer.id,
                'company_name': project.customer.company_name,
                'user_email': project.customer.user.email,
                'user_name': project.customer.user.full_name
            },
            'project_manager': {
                'id': project.project_manager.id,
                'full_name': project.project_manager.full_name,
                'email': project.project_manager.email,
                'role': project.project_manager.role
            } if project.project_manager else None,
            'created_at': project.created_at,
            'updated_at': project.updated_at
        })

    return result


@router.get("/{project_id}", response=ProjectOut, auth=auth_bearer)
def get_project(request, project_id: UUID):
    """Get project details"""
    try:
        project = Project.objects.select_related('customer__user', 'project_manager').get(id=project_id)

        # Check permission
        user = request.auth
        if user.is_customer and project.customer.user != user:
            return APIResponse.error_response("Permission denied")
        elif user.role in ['developer'] and not project.team_members.filter(id=user.id).exists():
            return APIResponse.error_response("Permission denied")

        # Manually serialize
        return {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'status': project.status,
            'priority': project.priority,
            'customer': {
                'id': project.customer.id,
                'company_name': project.customer.company_name,
                'user_email': project.customer.user.email,
                'user_name': project.customer.user.full_name
            },
            'project_manager': {
                'id': project.project_manager.id,
                'full_name': project.project_manager.full_name,
                'email': project.project_manager.email,
                'role': project.project_manager.role
            } if project.project_manager else None,
            'start_date': project.start_date,
            'end_date': project.end_date,
            'estimated_hours': project.estimated_hours,
            'budget': float(project.budget) if project.budget else None,
            'repository_url': project.repository_url,
            'staging_url': project.staging_url,
            'production_url': project.production_url,
            'created_at': project.created_at,
            'updated_at': project.updated_at
        }
    except Project.DoesNotExist:
        return APIResponse.error_response("Project not found")


# Chat endpoints
@router.get("/{project_id}/messages", response=List[ChatMessageOut], auth=auth_bearer)
def list_messages(request, project_id: UUID, limit: int = 50):
    """Get chat messages for a project"""
    try:
        project = Project.objects.get(id=project_id)

        # Check permission
        user = request.auth
        if not ChatParticipant.objects.filter(project=project, user=user).exists():
            if not (user.role in ['admin'] or project.project_manager == user):
                return APIResponse.error_response("Permission denied")

        messages = ChatMessage.objects.filter(
            project=project
        ).select_related('sender').order_by('-created_at')[:limit]

        return list(reversed(list(messages)))

    except Project.DoesNotExist:
        return APIResponse.error_response("Project not found")


@router.post("/{project_id}/messages", response=ChatMessageOut, auth=auth_bearer)
def send_message(request, project_id: UUID, payload: ChatMessageCreate):
    """Send a chat message"""
    try:
        project = Project.objects.get(id=project_id)
        user = request.auth

        # Check permission
        if not ChatParticipant.objects.filter(project=project, user=user).exists():
            if not (user.role in ['admin'] or project.project_manager == user):
                return APIResponse.error_response("Permission denied")

        # Create message
        message = ChatMessage.objects.create(
            project=project,
            sender=user,
            message=payload.message,
            message_type=payload.message_type or ChatMessage.MessageType.TEXT,
            attachments=payload.attachments or []
        )

        # Update participant's last activity
        ChatParticipant.objects.filter(project=project, user=user).update(
            last_read_at=timezone.now()
        )

        return message

    except Project.DoesNotExist:
        return APIResponse.error_response("Project not found")


@router.post("/{project_id}/messages/{message_id}/read", auth=auth_bearer)
def mark_message_read(request, project_id: UUID, message_id: UUID):
    """Mark a message as read"""
    try:
        message = ChatMessage.objects.get(id=message_id, project_id=project_id)

        # Only allow marking messages sent by others
        if message.sender != request.auth:
            message.is_read = True
            message.read_at = timezone.now()
            message.save()

        return {"success": True}

    except ChatMessage.DoesNotExist:
        return APIResponse.error_response("Message not found")


@router.get("/{project_id}/unread-count", auth=auth_bearer)
def get_unread_count(request, project_id: UUID):
    """Get unread message count for current user"""
    try:
        project = Project.objects.get(id=project_id)
        user = request.auth

        # Get last read time
        participant = ChatParticipant.objects.filter(project=project, user=user).first()

        if not participant:
            return {"count": 0}

        # Count messages after last read time
        if participant.last_read_at:
            count = ChatMessage.objects.filter(
                project=project,
                created_at__gt=participant.last_read_at
            ).exclude(sender=user).count()
        else:
            count = ChatMessage.objects.filter(
                project=project
            ).exclude(sender=user).count()

        return {"count": count}

    except Project.DoesNotExist:
        return APIResponse.error_response("Project not found")
