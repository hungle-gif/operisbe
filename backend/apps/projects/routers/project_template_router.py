"""
Project Template API endpoints
"""
from uuid import UUID
from typing import List
from ninja import Router
from ninja.errors import HttpError
from apps.projects.models import ProjectTemplate
from apps.projects.schemas.project_template_schema import (
    ProjectTemplateOut, ProjectTemplateListOut,
    ProjectTemplateCreate, ProjectTemplateUpdate
)
from api.dependencies.current_user import auth_bearer, require_roles
from core.responses.api_response import APIResponse

router = Router(tags=['Project Templates'])


@router.get("", response=List[ProjectTemplateListOut])
def list_project_templates(request, category: str = None, is_active: bool = True):
    """
    List all active project templates (public endpoint)
    Used by customers when creating service requests
    """
    queryset = ProjectTemplate.objects.all()

    # Filter by active status
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)

    # Filter by category if provided
    if category:
        queryset = queryset.filter(category=category)

    # Order by display_order and name
    queryset = queryset.order_by('display_order', 'name')

    return list(queryset)


@router.get("/admin/all", response=List[ProjectTemplateOut], auth=auth_bearer)
@require_roles('admin')
def list_all_project_templates_admin(request, category: str = None):
    """
    🔒 ADMIN ONLY: List all project templates (including inactive)
    """
    queryset = ProjectTemplate.objects.all()

    # Filter by category if provided
    if category:
        queryset = queryset.filter(category=category)

    # Order by display_order and name
    queryset = queryset.order_by('display_order', 'name')

    return list(queryset)


@router.get("/{template_id}", response=ProjectTemplateOut)
def get_project_template(request, template_id: UUID):
    """
    Get project template details (public endpoint)
    """
    try:
        template = ProjectTemplate.objects.get(id=template_id)
        return template
    except ProjectTemplate.DoesNotExist:
        raise HttpError(404, "Project template not found")


@router.post("", response=ProjectTemplateOut, auth=auth_bearer)
@require_roles('admin')
def create_project_template(request, payload: ProjectTemplateCreate):
    """
    🔒 ADMIN ONLY: Create new project template
    """
    try:
        template = ProjectTemplate.objects.create(
            name=payload.name,
            description=payload.description,
            category=payload.category,
            icon=payload.icon,
            price_min=payload.price_min,
            price_max=payload.price_max,
            estimated_duration_min=payload.estimated_duration_min,
            estimated_duration_max=payload.estimated_duration_max,
            key_features=payload.key_features,
            deliverables=payload.deliverables,
            technologies=payload.technologies,
            phases=payload.phases,
            team_structure=payload.team_structure,
            is_active=payload.is_active,
            display_order=payload.display_order
        )
        return template
    except Exception as e:
        raise HttpError(400, f"Failed to create project template: {str(e)}")


@router.put("/{template_id}", response=ProjectTemplateOut, auth=auth_bearer)
@require_roles('admin')
def update_project_template(request, template_id: UUID, payload: ProjectTemplateUpdate):
    """
    🔒 ADMIN ONLY: Update project template
    """
    try:
        template = ProjectTemplate.objects.get(id=template_id)

        # Update fields if provided
        update_data = payload.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)

        template.save()
        return template

    except ProjectTemplate.DoesNotExist:
        raise HttpError(404, "Project template not found")
    except Exception as e:
        raise HttpError(400, f"Failed to update project template: {str(e)}")


@router.delete("/{template_id}", auth=auth_bearer)
@require_roles('admin')
def delete_project_template(request, template_id: UUID):
    """
    🔒 ADMIN ONLY: Delete project template
    """
    try:
        template = ProjectTemplate.objects.get(id=template_id)
        template.delete()
        return {"success": True, "message": "Project template deleted successfully"}
    except ProjectTemplate.DoesNotExist:
        raise HttpError(404, "Project template not found")
    except Exception as e:
        raise HttpError(400, f"Failed to delete project template: {str(e)}")


@router.get("/categories/list", response=List[dict])
def list_categories(request):
    """
    Get list of available project template categories
    """
    from apps.projects.models import ProjectTemplateCategory

    categories = [
        {
            "value": choice[0],
            "label": choice[1]
        }
        for choice in ProjectTemplateCategory.choices
    ]

    return categories
