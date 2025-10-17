"""
Project service for business logic
"""
from django.db.models import Count, Q
from apps.users.models import User
from apps.projects.models import Project, ProjectStatus, ChatParticipant
from apps.services.models import ServiceRequest
from apps.customers.models import Customer


class ProjectService:
    """Business logic for project management"""

    @staticmethod
    def get_least_busy_sales():
        """
        Find the sales person with the least number of active negotiation projects
        Returns the User object of the least busy sales person
        """
        # Get all users with role 'sales'
        sales_users = User.objects.filter(role='sales', is_active=True)

        if not sales_users.exists():
            # If no sales users, try to find admin users
            sales_users = User.objects.filter(role='admin', is_active=True)

        if not sales_users.exists():
            return None

        # Count active negotiation projects for each sales person
        sales_with_project_count = sales_users.annotate(
            negotiation_count=Count(
                'managed_projects',
                filter=Q(managed_projects__status=ProjectStatus.NEGOTIATION)
            )
        ).order_by('negotiation_count')

        # Return the sales person with the least projects
        return sales_with_project_count.first()

    @staticmethod
    def create_project_from_service_request(service_request: ServiceRequest):
        """
        Create a new project from a service request
        Auto-assign to the least busy sales person
        Initialize chat participants

        Args:
            service_request: ServiceRequest object

        Returns:
            Project object
        """
        # Find least busy sales
        assigned_sales = ProjectService.get_least_busy_sales()

        # Get or create customer
        customer = Customer.objects.filter(user=service_request.customer).first()
        if not customer:
            # Create customer record if doesn't exist
            customer = Customer.objects.create(
                user=service_request.customer,
                company_name=service_request.company_name or ''
            )

        # Create project name from service
        project_name = f"{service_request.service.name} - {service_request.company_name or service_request.contact_name}"

        # Build project description from form data
        description_parts = [
            f"**Dịch vụ:** {service_request.service.name}",
            f"**Công ty:** {service_request.company_name}",
            f"**Người liên hệ:** {service_request.contact_name}",
            f"**Email:** {service_request.contact_email}",
            f"**Điện thoại:** {service_request.contact_phone}",
            f"**Zalo:** {service_request.zalo_number}",
            f"**Số người dùng hệ thống:** {service_request.system_users_count}",
            f"**Chức năng cần có:** {', '.join(service_request.required_functions)}",
        ]

        if service_request.special_requirements:
            description_parts.append(f"\n**Yêu cầu đặc biệt:**\n{service_request.special_requirements}")

        if service_request.workflow_description:
            description_parts.append(f"\n**Mô tả luồng công việc:**\n{service_request.workflow_description}")

        project_description = "\n\n".join(description_parts)

        # Create project
        project = Project.objects.create(
            name=project_name,
            description=project_description,
            customer=customer,
            project_manager=assigned_sales,
            status=ProjectStatus.NEGOTIATION,  # Start with NEGOTIATION status
            priority='medium'
        )

        # Update service request
        service_request.status = ServiceRequest.Status.CONVERTED
        service_request.converted_project = project
        service_request.assigned_to = assigned_sales
        service_request.save()

        # Initialize chat participants
        # Add customer
        ChatParticipant.objects.create(
            project=project,
            user=service_request.customer
        )

        # Add assigned sales
        if assigned_sales:
            ChatParticipant.objects.create(
                project=project,
                user=assigned_sales
            )

        # Send initial system message
        from apps.projects.models import ChatMessage
        ChatMessage.objects.create(
            project=project,
            sender=assigned_sales if assigned_sales else service_request.customer,
            message=f"Dự án được tạo từ yêu cầu dịch vụ. Sale phụ trách: {assigned_sales.full_name if assigned_sales else 'Chưa phân công'}",
            message_type=ChatMessage.MessageType.SYSTEM
        )

        return project

    @staticmethod
    def get_available_developers():
        """
        Get all active developers ordered by current workload (ascending)
        Returns developers with least projects first for load balancing
        """
        from apps.users.models import UserRole

        developers = User.objects.filter(
            role=UserRole.DEV,
            is_active=True
        ).annotate(
            active_projects_count=Count(
                'assigned_projects',
                filter=Q(
                    assigned_projects__status__in=[
                        ProjectStatus.IN_PROGRESS,
                        ProjectStatus.PENDING_ACCEPTANCE,
                        ProjectStatus.REVISION_REQUIRED
                    ]
                )
            )
        ).order_by('active_projects_count')

        return list(developers)

    @staticmethod
    def auto_assign_developers(project: Project, num_developers: int = 1):
        """
        Automatically assign developers to a project
        Uses round-robin with load balancing

        Args:
            project: Project instance to assign developers to
            num_developers: Number of developers to assign (default: 1)

        Returns:
            List of assigned developers
        """
        available_devs = ProjectService.get_available_developers()

        if not available_devs:
            return []

        # Select developers with least workload
        num_to_assign = min(num_developers, len(available_devs))
        selected_devs = available_devs[:num_to_assign]

        # Add developers to project
        for dev in selected_devs:
            project.team_members.add(dev)

            # Add developer to chat participants
            ChatParticipant.objects.get_or_create(
                project=project,
                user=dev
            )

        project.save()

        # Send system message
        from apps.projects.models import ChatMessage
        dev_names = ', '.join([dev.full_name for dev in selected_devs])
        ChatMessage.objects.create(
            project=project,
            sender=project.project_manager if project.project_manager else selected_devs[0],
            message=f"🎯 Dự án đã được tự động phân công cho: {dev_names}",
            message_type=ChatMessage.MessageType.SYSTEM
        )

        return selected_devs

    @staticmethod
    def auto_assign_on_deposit_approval(project: Project):
        """
        Auto-assign developers when deposit is approved
        Assigns 1-2 developers based on project priority

        Args:
            project: Project instance

        Returns:
            List of assigned developers
        """
        # Determine number of developers based on priority
        num_devs = 1  # Default

        if project.priority == 'urgent':
            num_devs = 2  # Assign 2 developers for urgent projects
        elif project.priority == 'high':
            num_devs = 1
        else:
            num_devs = 1

        # Auto-assign developers
        assigned_devs = ProjectService.auto_assign_developers(project, num_devs)

        # Update project status to IN_PROGRESS
        project.status = ProjectStatus.IN_PROGRESS
        project.save()

        return assigned_devs
