"""
Service API endpoints
"""
from uuid import UUID
from typing import List
from ninja import Router
from apps.services.models import Service, ServiceRequest
from apps.services.schemas.service_schema import (
    ServiceOut, ServiceListOut, ServiceCreate,
    ServiceRequestCreate, ServiceRequestOut, ServiceRequestUpdate
)
from api.dependencies.current_user import auth_bearer
from core.responses.api_response import APIResponse

router = Router(tags=['Services'])


@router.get("", response=List[ServiceListOut])
def list_services(request, is_active: bool = True, is_featured: bool = None):
    """Danh sách dịch vụ (public)"""
    queryset = Service.objects.filter(is_active=is_active)
    if is_featured is not None:
        queryset = queryset.filter(is_featured=is_featured)
    return list(queryset)


@router.post("", response=ServiceOut, auth=auth_bearer)
def create_service(request, payload: ServiceCreate):
    """Tạo dịch vụ mới (admin only)"""
    if not request.auth.is_admin:
        return APIResponse.error_response("Permission denied")

    service = Service.objects.create(**payload.dict())
    return service


# Service Request endpoints - MUST BE BEFORE /{slug} route!
@router.post("/requests", response=ServiceRequestOut, auth=auth_bearer)
def create_service_request(request, payload: ServiceRequestCreate):
    """Tạo yêu cầu dịch vụ (customer)"""
    try:
        service = Service.objects.get(id=payload.service_id)
    except Service.DoesNotExist:
        return APIResponse.error_response("Service not found")

    data = payload.dict()
    data['service'] = service
    data['customer'] = request.auth
    data.pop('service_id')

    service_request = ServiceRequest.objects.create(**data)

    # Auto-create project and assign sales
    from apps.projects.services import ProjectService
    project = ProjectService.create_project_from_service_request(service_request)

    # Manually serialize to match schema expectations
    return {
        'id': service_request.id,
        'service': service,
        'customer': {
            'id': str(request.auth.id),
            'email': request.auth.email,
            'full_name': request.auth.full_name,
            'role': request.auth.role
        },
        'contact_name': service_request.contact_name,
        'contact_email': service_request.contact_email,
        'contact_phone': service_request.contact_phone,
        'company_name': service_request.company_name,
        'project_description': service_request.project_description,
        'requirements': service_request.requirements,
        'budget_range': service_request.budget_range,
        'expected_timeline': service_request.expected_timeline,
        'status': service_request.status,
        'admin_notes': service_request.admin_notes,
        'assigned_to': {
            'id': str(project.project_manager.id),
            'full_name': project.project_manager.full_name,
            'email': project.project_manager.email
        } if project.project_manager else None,
        'created_at': service_request.created_at,
        'updated_at': service_request.updated_at,
        'project_id': str(project.id)  # Return project ID for redirect
    }


@router.get("/requests", response=List[ServiceRequestOut], auth=auth_bearer)
def list_service_requests(request, status: str = None):
    """Danh sách yêu cầu dịch vụ"""
    if request.auth.is_customer:
        # Customer chỉ thấy request của mình
        queryset = ServiceRequest.objects.filter(customer=request.auth)
    else:
        # Admin/Sale thấy tất cả
        queryset = ServiceRequest.objects.all()

    if status:
        queryset = queryset.filter(status=status)

    queryset = queryset.select_related('service', 'customer', 'assigned_to', 'converted_project')

    # Manually serialize to include converted_project
    result = []
    for sr in queryset:
        result.append({
            'id': sr.id,
            'service': {
                'id': sr.service.id,
                'name': sr.service.name,
                'slug': sr.service.slug,
                'category': sr.service.category,
                'short_description': sr.service.short_description,
                'icon': sr.service.icon,
                'thumbnail': sr.service.thumbnail,
                'is_featured': sr.service.is_featured,
                'estimated_duration_min': sr.service.estimated_duration_min,
                'estimated_duration_max': sr.service.estimated_duration_max,
                'price_range_min': float(sr.service.price_range_min) if sr.service.price_range_min else None,
                'price_range_max': float(sr.service.price_range_max) if sr.service.price_range_max else None
            },
            'customer': {
                'id': str(sr.customer.id),
                'email': sr.customer.email,
                'full_name': sr.customer.full_name,
                'role': sr.customer.role
            },
            'contact_name': sr.contact_name,
            'contact_email': sr.contact_email,
            'contact_phone': sr.contact_phone,
            'company_name': sr.company_name,
            'project_description': sr.project_description,
            'requirements': sr.requirements,
            'budget_range': sr.budget_range,
            'expected_timeline': sr.expected_timeline,
            'status': sr.status,
            'admin_notes': sr.admin_notes,
            'assigned_to': {
                'id': str(sr.assigned_to.id),
                'full_name': sr.assigned_to.full_name,
                'email': sr.assigned_to.email
            } if sr.assigned_to else None,
            'converted_project': {
                'id': str(sr.converted_project.id),
                'name': sr.converted_project.name
            } if sr.converted_project else None,
            'created_at': sr.created_at,
            'updated_at': sr.updated_at
        })

    return result


@router.get("/requests/{request_id}", response=ServiceRequestOut, auth=auth_bearer)
def get_service_request(request, request_id: UUID):
    """Chi tiết yêu cầu dịch vụ"""
    try:
        service_request = ServiceRequest.objects.get(id=request_id)

        # Check permission
        if request.auth.is_customer and service_request.customer != request.auth:
            return APIResponse.error_response("Permission denied")

        return service_request
    except ServiceRequest.DoesNotExist:
        return APIResponse.error_response("Service request not found")


@router.put("/requests/{request_id}", response=ServiceRequestOut, auth=auth_bearer)
def update_service_request(request, request_id: UUID, payload: ServiceRequestUpdate):
    """Cập nhật yêu cầu dịch vụ (admin/sale only)"""
    if request.auth.is_customer:
        return APIResponse.error_response("Permission denied")

    try:
        service_request = ServiceRequest.objects.get(id=request_id)

        for field, value in payload.dict(exclude_unset=True).items():
            if field == 'assigned_to_id' and value:
                from apps.users.models import User
                assigned_user = User.objects.get(id=value)
                service_request.assigned_to = assigned_user
            else:
                setattr(service_request, field, value)

        service_request.save()
        return service_request
    except ServiceRequest.DoesNotExist:
        return APIResponse.error_response("Service request not found")


# Service detail by slug - MUST BE LAST to avoid catching /requests as a slug!
@router.get("/{slug}", response=ServiceOut)
def get_service(request, slug: str):
    """Chi tiết dịch vụ (public)"""
    try:
        service = Service.objects.get(slug=slug, is_active=True)
        return service
    except Service.DoesNotExist:
        return APIResponse.error_response("Service not found")
