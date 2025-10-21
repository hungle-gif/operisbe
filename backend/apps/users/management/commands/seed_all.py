"""
Django management command to seed all database tables with sample data
Usage: python manage.py seed_all
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import random
import uuid

from apps.customers.models import Customer
from apps.sales.models import Lead, Deal
from apps.services.models import Service, ServiceRequest
from apps.projects.models import (
    Project, ProjectTemplate, Proposal,
    ChatMessage, ChatParticipant, ProjectFeedback, Transaction
)
from apps.tasks.models import Task

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed all database tables with sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            self.clear_data()

        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))

        # Seed in order of dependencies
        users = self.seed_users()
        customers = self.seed_customers(users)
        leads = self.seed_leads(users)
        deals = self.seed_deals(leads, users)
        services = self.seed_services()
        templates = self.seed_project_templates()
        projects = self.seed_projects(customers, users)
        service_requests = self.seed_service_requests(services, users, projects)
        proposals = self.seed_proposals(projects, users)
        transactions = self.seed_transactions(projects, proposals, users)
        self.seed_chat_messages(projects, users)
        self.seed_chat_participants(projects, users)
        tasks = self.seed_tasks(projects, users)
        self.seed_project_feedback(projects, users)

        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
        self.stdout.write(self.style.SUCCESS('='*60))

    def clear_data(self):
        """Clear all existing data"""
        Transaction.objects.all().delete()
        ProjectFeedback.objects.all().delete()
        Task.objects.all().delete()
        ChatParticipant.objects.all().delete()
        ChatMessage.objects.all().delete()
        Proposal.objects.all().delete()
        ServiceRequest.objects.all().delete()
        Project.objects.all().delete()
        ProjectTemplate.objects.all().delete()
        Service.objects.all().delete()
        Deal.objects.all().delete()
        Lead.objects.all().delete()
        Customer.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write(self.style.SUCCESS('Data cleared successfully'))

    def seed_users(self):
        """Seed users with different roles"""
        self.stdout.write('Seeding users...')

        users = []

        # Create superuser if not exists
        if not User.objects.filter(email='admin@operis.vn').exists():
            superuser = User.objects.create_superuser(
                email='admin@operis.vn',
                username='admin',
                password='admin123',
                full_name='System Administrator',
                phone='+84901234567',
                role='admin',
                is_staff=True
            )
            users.append(superuser)
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created superuser: {superuser.email}'))

        # Admin users
        admin_data = [
            ('Nguyễn Văn An', 'an.nguyen@operis.vn', '+84901111111', 'admin'),
            ('Trần Thị Bình', 'binh.tran@operis.vn', '+84901111112', 'admin'),
        ]

        # Sale users
        sale_data = [
            ('Lê Văn Cường', 'cuong.le@operis.vn', '+84902222221', 'sale'),
            ('Phạm Thị Dung', 'dung.pham@operis.vn', '+84902222222', 'sale'),
            ('Hoàng Văn Em', 'em.hoang@operis.vn', '+84902222223', 'sale'),
        ]

        # Developer users
        dev_data = [
            ('Vũ Văn Phúc', 'phuc.vu@operis.vn', '+84903333331', 'dev'),
            ('Đặng Thị Giang', 'giang.dang@operis.vn', '+84903333332', 'dev'),
            ('Bùi Văn Hải', 'hai.bui@operis.vn', '+84903333333', 'dev'),
            ('Ngô Thị Hoa', 'hoa.ngo@operis.vn', '+84903333334', 'dev'),
            ('Trương Văn Khoa', 'khoa.truong@operis.vn', '+84903333335', 'dev'),
        ]

        # Customer users
        customer_data = [
            ('Lý Văn Long', 'long.ly@company1.vn', '+84904444441', 'customer'),
            ('Võ Thị Mai', 'mai.vo@company2.vn', '+84904444442', 'customer'),
            ('Đinh Văn Nam', 'nam.dinh@company3.vn', '+84904444443', 'customer'),
            ('Mai Thị Oanh', 'oanh.mai@company4.vn', '+84904444444', 'customer'),
            ('Phan Văn Phương', 'phuong.phan@company5.vn', '+84904444445', 'customer'),
        ]

        all_user_data = admin_data + sale_data + dev_data + customer_data

        for full_name, email, phone, role in all_user_data:
            if not User.objects.filter(email=email).exists():
                username = email.split('@')[0]
                user = User.objects.create_user(
                    email=email,
                    username=username,
                    password='password123',
                    full_name=full_name,
                    phone=phone,
                    role=role,
                    is_staff=(role in ['admin', 'sale', 'dev']),
                    is_active=True
                )
                users.append(user)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(users)} users'))
        return users

    def seed_customers(self, users):
        """Seed customer profiles"""
        self.stdout.write('Seeding customers...')

        customer_users = [u for u in users if u.role == 'customer']
        customers = []

        company_data = [
            {
                'company_name': 'TechViet Solutions JSC',
                'company_website': 'https://techviet.vn',
                'industry': 'Software Development',
                'company_size': '50-100',
                'city': 'Hà Nội',
                'country': 'Vietnam',
            },
            {
                'company_name': 'Vietnam E-commerce Co., Ltd',
                'company_website': 'https://vnecom.vn',
                'industry': 'E-commerce',
                'company_size': '100-200',
                'city': 'Hồ Chí Minh',
                'country': 'Vietnam',
            },
            {
                'company_name': 'Smart Retail Vietnam',
                'company_website': 'https://smartretail.vn',
                'industry': 'Retail',
                'company_size': '20-50',
                'city': 'Đà Nẵng',
                'country': 'Vietnam',
            },
            {
                'company_name': 'FinTech Innovation Ltd',
                'company_website': 'https://fintech.vn',
                'industry': 'Finance',
                'company_size': '10-20',
                'city': 'Hà Nội',
                'country': 'Vietnam',
            },
            {
                'company_name': 'HealthCare Digital',
                'company_website': 'https://healthcare-digital.vn',
                'industry': 'Healthcare',
                'company_size': '50-100',
                'city': 'Hồ Chí Minh',
                'country': 'Vietnam',
            },
        ]

        for i, customer_user in enumerate(customer_users):
            if i < len(company_data):
                data = company_data[i]
            else:
                data = company_data[0]

            if not hasattr(customer_user, 'customer'):
                customer = Customer.objects.create(
                    user=customer_user,
                    company_name=data['company_name'],
                    company_website=data['company_website'],
                    industry=data['industry'],
                    company_size=data['company_size'],
                    address=f'{random.randint(1, 500)} {random.choice(["Nguyễn Huệ", "Lê Lợi", "Trần Hưng Đạo"])}',
                    city=data['city'],
                    country=data['country'],
                    postal_code=f'7000{i}',
                    tax_id=f'0{random.randint(100000000, 999999999)}',
                )
                customers.append(customer)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(customers)} customers'))
        return customers

    def seed_leads(self, users):
        """Seed leads"""
        self.stdout.write('Seeding leads...')

        sales_users = [u for u in users if u.role == 'sale']
        leads = []

        lead_data = [
            {
                'full_name': 'Nguyễn Văn A',
                'email': 'nguyenvana@example.com',
                'phone': '+84905555551',
                'company_name': 'ABC Corporation',
                'status': 'new',
                'source': 'website',
                'description': 'Interested in web development services',
                'estimated_budget': Decimal('50000000'),
            },
            {
                'full_name': 'Trần Thị B',
                'email': 'tranthib@example.com',
                'phone': '+84905555552',
                'company_name': 'XYZ Ltd',
                'status': 'contacted',
                'source': 'referral',
                'description': 'Looking for mobile app development',
                'estimated_budget': Decimal('100000000'),
            },
            {
                'full_name': 'Lê Văn C',
                'email': 'levanc@example.com',
                'phone': '+84905555553',
                'company_name': 'DEF Company',
                'status': 'qualified',
                'source': 'social_media',
                'description': 'Need CRM system implementation',
                'estimated_budget': Decimal('200000000'),
            },
            {
                'full_name': 'Phạm Thị D',
                'email': 'phamthid@example.com',
                'phone': '+84905555554',
                'company_name': 'GHI Enterprise',
                'status': 'converted',
                'source': 'email',
                'description': 'E-commerce platform development',
                'estimated_budget': Decimal('150000000'),
            },
            {
                'full_name': 'Hoàng Văn E',
                'email': 'hoangvane@example.com',
                'phone': '+84905555555',
                'company_name': 'JKL Group',
                'status': 'new',
                'source': 'phone',
                'description': 'UI/UX design services',
                'estimated_budget': Decimal('30000000'),
            },
        ]

        for data in lead_data:
            lead = Lead.objects.create(
                full_name=data['full_name'],
                email=data['email'],
                phone=data['phone'],
                company_name=data['company_name'],
                status=data['status'],
                source=data['source'],
                assigned_to=random.choice(sales_users) if sales_users else None,
                description=data['description'],
                estimated_budget=data['estimated_budget'],
                expected_close_date=timezone.now().date() + timedelta(days=random.randint(30, 90)),
            )
            leads.append(lead)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(leads)} leads'))
        return leads

    def seed_deals(self, leads, users):
        """Seed deals"""
        self.stdout.write('Seeding deals...')

        sales_users = [u for u in users if u.role == 'sale']
        deals = []

        stages = ['qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

        for i, lead in enumerate(leads[:3]):  # Create deals for first 3 leads
            deal = Deal.objects.create(
                name=f'Deal for {lead.company_name}',
                description=f'Opportunity from {lead.full_name}',
                lead=lead,
                stage=random.choice(stages),
                amount=lead.estimated_budget or Decimal('50000000'),
                probability=random.randint(20, 90),
                owner=random.choice(sales_users) if sales_users else None,
                expected_close_date=timezone.now().date() + timedelta(days=random.randint(30, 90)),
            )
            deals.append(deal)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(deals)} deals'))
        return deals

    def seed_services(self):
        """Seed services"""
        self.stdout.write('Seeding services...')

        services_data = [
            {
                'name': 'Phát triển Website',
                'slug': 'web-development',
                'category': 'web_development',
                'short_description': 'Xây dựng website chuyên nghiệp, tối ưu SEO và trải nghiệm người dùng',
                'full_description': 'Dịch vụ phát triển website toàn diện từ landing page đến hệ thống web phức tạp.',
                'key_features': ['Responsive Design', 'SEO Optimized', 'Fast Loading', 'Security'],
                'technologies': ['React', 'Next.js', 'Django', 'PostgreSQL'],
                'estimated_team_size': 4,
                'estimated_duration_min': 30,
                'estimated_duration_max': 90,
                'price_range_min': Decimal('30000000'),
                'price_range_max': Decimal('200000000'),
                'icon': 'web',
            },
            {
                'name': 'Phát triển Mobile App',
                'slug': 'mobile-app-development',
                'category': 'mobile_app',
                'short_description': 'Ứng dụng di động iOS/Android với UX tối ưu',
                'full_description': 'Phát triển ứng dụng mobile native hoặc cross-platform cho iOS và Android.',
                'key_features': ['Cross-platform', 'Native Performance', 'Offline Support', 'Push Notifications'],
                'technologies': ['React Native', 'Flutter', 'iOS', 'Android'],
                'estimated_team_size': 3,
                'estimated_duration_min': 60,
                'estimated_duration_max': 120,
                'price_range_min': Decimal('80000000'),
                'price_range_max': Decimal('300000000'),
                'icon': 'mobile',
            },
            {
                'name': 'Thiết kế UI/UX',
                'slug': 'ui-ux-design',
                'category': 'ui_ux_design',
                'short_description': 'Thiết kế giao diện và trải nghiệm người dùng chuyên nghiệp',
                'full_description': 'Dịch vụ thiết kế UI/UX tập trung vào trải nghiệm người dùng và chuyển đổi.',
                'key_features': ['User Research', 'Wireframing', 'Prototyping', 'User Testing'],
                'technologies': ['Figma', 'Adobe XD', 'Sketch', 'InVision'],
                'estimated_team_size': 2,
                'estimated_duration_min': 15,
                'estimated_duration_max': 45,
                'price_range_min': Decimal('20000000'),
                'price_range_max': Decimal('100000000'),
                'icon': 'design',
            },
            {
                'name': 'Hệ thống CRM',
                'slug': 'crm-system',
                'category': 'crm_system',
                'short_description': 'Quản lý quan hệ khách hàng toàn diện',
                'full_description': 'Hệ thống CRM tùy chỉnh giúp quản lý khách hàng, sales pipeline và marketing.',
                'key_features': ['Lead Management', 'Sales Pipeline', 'Email Integration', 'Reports & Analytics'],
                'technologies': ['Django', 'React', 'PostgreSQL', 'Redis'],
                'estimated_team_size': 5,
                'estimated_duration_min': 90,
                'estimated_duration_max': 180,
                'price_range_min': Decimal('150000000'),
                'price_range_max': Decimal('500000000'),
                'icon': 'crm',
            },
            {
                'name': 'Sàn thương mại điện tử',
                'slug': 'ecommerce-platform',
                'category': 'ecommerce',
                'short_description': 'Nền tảng bán hàng online đa kênh',
                'full_description': 'Xây dựng sàn thương mại điện tử với đầy đủ tính năng thanh toán, vận chuyển.',
                'key_features': ['Product Management', 'Payment Gateway', 'Order Tracking', 'Inventory'],
                'technologies': ['Next.js', 'Stripe', 'Django', 'AWS'],
                'estimated_team_size': 6,
                'estimated_duration_min': 120,
                'estimated_duration_max': 240,
                'price_range_min': Decimal('200000000'),
                'price_range_max': Decimal('800000000'),
                'icon': 'ecommerce',
            },
        ]

        services = []
        for i, data in enumerate(services_data):
            service = Service.objects.create(
                name=data['name'],
                slug=data['slug'],
                category=data['category'],
                short_description=data['short_description'],
                full_description=data['full_description'],
                key_features=data['key_features'],
                differentiators=['High Quality', 'Fast Delivery', '24/7 Support'],
                process_stages=['Discovery', 'Design', 'Development', 'Testing', 'Deployment'],
                team_structure={'pm': 1, 'dev': data['estimated_team_size'] - 2, 'qa': 1},
                estimated_team_size=data['estimated_team_size'],
                estimated_duration_min=data['estimated_duration_min'],
                estimated_duration_max=data['estimated_duration_max'],
                price_range_min=data['price_range_min'],
                price_range_max=data['price_range_max'],
                icon=data['icon'],
                gallery=['image1.jpg', 'image2.jpg', 'image3.jpg'],
                is_active=True,
                is_featured=(i < 3),
                order=i + 1,
                technologies=data['technologies'],
            )
            services.append(service)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(services)} services'))
        return services

    def seed_project_templates(self):
        """Seed project templates"""
        self.stdout.write('Seeding project templates...')

        templates_data = [
            {
                'name': 'Website Cơ bản',
                'category': 'web_development',
                'price_min': Decimal('30000000'),
                'price_max': Decimal('50000000'),
                'estimated_duration_min': 30,
                'estimated_duration_max': 45,
                'key_features': ['Responsive Design', '5-10 Pages', 'Contact Form', 'SEO Basic'],
                'technologies': ['HTML/CSS', 'JavaScript', 'React'],
            },
            {
                'name': 'Mobile App Cơ bản',
                'category': 'mobile_app',
                'price_min': Decimal('80000000'),
                'price_max': Decimal('150000000'),
                'estimated_duration_min': 60,
                'estimated_duration_max': 90,
                'key_features': ['iOS & Android', 'User Authentication', 'Push Notifications', 'Offline Mode'],
                'technologies': ['React Native', 'Firebase'],
            },
            {
                'name': 'E-commerce Platform',
                'category': 'ecommerce',
                'price_min': Decimal('200000000'),
                'price_max': Decimal('400000000'),
                'estimated_duration_min': 120,
                'estimated_duration_max': 180,
                'key_features': ['Product Catalog', 'Shopping Cart', 'Payment Integration', 'Admin Panel'],
                'technologies': ['Next.js', 'Django', 'Stripe', 'PostgreSQL'],
            },
        ]

        templates = []
        for i, data in enumerate(templates_data):
            template = ProjectTemplate.objects.create(
                name=data['name'],
                description=f'Template cho {data["name"]}',
                category=data['category'],
                icon='template',
                price_min=data['price_min'],
                price_max=data['price_max'],
                estimated_duration_min=data['estimated_duration_min'],
                estimated_duration_max=data['estimated_duration_max'],
                key_features=data['key_features'],
                deliverables=['Source Code', 'Documentation', 'Deployment Guide'],
                technologies=data['technologies'],
                phases=['Planning', 'Design', 'Development', 'Testing', 'Deployment'],
                team_structure={'pm': 1, 'dev': 3, 'qa': 1},
                options={'maintenance': True, 'training': True},
                is_active=True,
                display_order=i + 1,
            )
            templates.append(template)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(templates)} project templates'))
        return templates

    def seed_projects(self, customers, users):
        """Seed projects"""
        self.stdout.write('Seeding projects...')

        pm_users = [u for u in users if u.role in ['admin', 'dev']]
        dev_users = [u for u in users if u.role == 'dev']

        statuses = ['negotiation', 'deposit', 'pending', 'in_progress', 'completed']
        priorities = ['low', 'medium', 'high', 'urgent']

        projects = []
        for i, customer in enumerate(customers):
            project = Project.objects.create(
                name=f'Dự án {customer.company_name}',
                description=f'Phát triển hệ thống cho {customer.company_name}',
                customer=customer,
                project_manager=random.choice(pm_users) if pm_users else None,
                status=random.choice(statuses),
                priority=random.choice(priorities),
                start_date=timezone.now().date() - timedelta(days=random.randint(0, 60)),
                end_date=timezone.now().date() + timedelta(days=random.randint(30, 120)),
                estimated_hours=random.randint(200, 1000),
                budget=Decimal(str(random.randint(50, 500))) * Decimal('1000000'),
            )

            # Add team members
            if dev_users:
                team = random.sample(dev_users, min(3, len(dev_users)))
                project.team_members.set(team)

            projects.append(project)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(projects)} projects'))
        return projects

    def seed_service_requests(self, services, users, projects):
        """Seed service requests"""
        self.stdout.write('Seeding service requests...')

        customer_users = [u for u in users if u.role == 'customer']
        admin_users = [u for u in users if u.role in ['admin', 'sale']]

        statuses = ['pending', 'reviewing', 'approved', 'converted']

        requests = []
        for i, service in enumerate(services):
            if i < len(customer_users):
                customer = customer_users[i]

                request = ServiceRequest.objects.create(
                    service=service,
                    customer=customer,
                    contact_name=customer.full_name,
                    contact_email=customer.email,
                    contact_phone=customer.phone,
                    company_name=getattr(customer, 'customer', None).company_name if hasattr(customer, 'customer') else 'Company',
                    system_users_count=random.randint(5, 50),
                    required_functions=['Feature 1', 'Feature 2', 'Feature 3'],
                    project_description=f'Yêu cầu phát triển {service.name}',
                    requirements={'technical': ['Requirement 1', 'Requirement 2'], 'business': ['Business need 1']},
                    budget_range='50-100 triệu',
                    expected_timeline='3-6 tháng',
                    status=random.choice(statuses),
                    assigned_to=random.choice(admin_users) if admin_users else None,
                    converted_project=projects[i] if i < len(projects) and random.choice([True, False]) else None,
                )
                requests.append(request)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(requests)} service requests'))
        return requests

    def seed_proposals(self, projects, users):
        """Seed proposals"""
        self.stdout.write('Seeding proposals...')

        admin_users = [u for u in users if u.role == 'admin']
        statuses = ['draft', 'sent', 'viewed', 'accepted', 'negotiating']

        proposals = []
        for i, project in enumerate(projects[:3]):  # Create proposals for first 3 projects
            proposal = Proposal.objects.create(
                project=project,
                created_by=random.choice(admin_users) if admin_users else users[0],
                project_analysis='Phân tích chi tiết dự án và yêu cầu khách hàng',
                total_price=project.budget or Decimal('100000000'),
                currency='VND',
                estimated_start_date=project.start_date,
                estimated_end_date=project.end_date,
                estimated_duration_days=(project.end_date - project.start_date).days if project.end_date and project.start_date else 90,
                deposit_amount=Decimal('10000000'),
                deposit_paid=random.choice([True, False]),
                full_payment_option=False,
                phases=[
                    {'name': 'Phase 1', 'price': '30000000', 'duration': '30 days'},
                    {'name': 'Phase 2', 'price': '40000000', 'duration': '30 days'},
                    {'name': 'Phase 3', 'price': '30000000', 'duration': '30 days'},
                ],
                team_members=[{'role': 'PM', 'count': 1}, {'role': 'Dev', 'count': 3}, {'role': 'QA', 'count': 1}],
                milestones=['Milestone 1', 'Milestone 2', 'Milestone 3'],
                deliverables=['Source Code', 'Documentation', 'Training'],
                status=random.choice(statuses),
                valid_until=timezone.now().date() + timedelta(days=30),
                payment_terms='Thanh toán theo giai đoạn',
                scope_of_work='Phạm vi công việc chi tiết',
                payment_proof=[],
                customer_approvals={},
            )
            proposals.append(proposal)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(proposals)} proposals'))
        return proposals

    def seed_transactions(self, projects, proposals, users):
        """Seed transactions"""
        self.stdout.write('Seeding transactions...')

        admin_users = [u for u in users if u.role == 'admin']

        transactions = []
        for proposal in proposals:
            # Deposit transaction
            transaction = Transaction.objects.create(
                project=proposal.project,
                proposal=proposal,
                customer=proposal.project.customer.user,
                transaction_type='deposit',
                status='completed' if proposal.deposit_paid else 'pending',
                amount=proposal.deposit_amount,
                payment_method='bank_transfer',
                description=f'Deposit payment for {proposal.project.name}',
                metadata={'proposal_id': str(proposal.id)},
                processed_by=random.choice(admin_users) if admin_users and proposal.deposit_paid else None,
                completed_at=timezone.now() if proposal.deposit_paid else None,
            )
            transactions.append(transaction)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(transactions)} transactions'))
        return transactions

    def seed_chat_messages(self, projects, users):
        """Seed chat messages"""
        self.stdout.write('Seeding chat messages...')

        messages = []
        for project in projects[:3]:  # Add messages to first 3 projects
            # Get project team
            team_users = [project.customer.user]
            if project.project_manager:
                team_users.append(project.project_manager)
            team_users.extend(list(project.team_members.all()[:2]))

            for i in range(5):  # 5 messages per project
                message = ChatMessage.objects.create(
                    project=project,
                    sender=random.choice(team_users),
                    message=f'Message {i+1} for project {project.name}',
                    attachments=[],
                    is_read=random.choice([True, False]),
                    message_type='text',
                )
                messages.append(message)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(messages)} chat messages'))
        return messages

    def seed_chat_participants(self, projects, users):
        """Seed chat participants"""
        self.stdout.write('Seeding chat participants...')

        participants = []
        for project in projects[:3]:  # Add participants to first 3 projects
            # Customer
            participant = ChatParticipant.objects.get_or_create(
                project=project,
                user=project.customer.user,
                defaults={'is_typing': False}
            )[0]
            participants.append(participant)

            # PM
            if project.project_manager:
                participant = ChatParticipant.objects.get_or_create(
                    project=project,
                    user=project.project_manager,
                    defaults={'is_typing': False}
                )[0]
                participants.append(participant)

            # Team members
            for member in project.team_members.all()[:2]:
                participant = ChatParticipant.objects.get_or_create(
                    project=project,
                    user=member,
                    defaults={'is_typing': False}
                )[0]
                participants.append(participant)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(participants)} chat participants'))
        return participants

    def seed_tasks(self, projects, users):
        """Seed tasks"""
        self.stdout.write('Seeding tasks...')

        dev_users = [u for u in users if u.role == 'dev']
        statuses = ['todo', 'in_progress', 'in_review', 'testing', 'done']
        priorities = ['low', 'medium', 'high', 'urgent']

        tasks = []
        for project in projects:
            for i in range(5):  # 5 tasks per project
                task = Task.objects.create(
                    title=f'Task {i+1} for {project.name}',
                    description=f'Description for task {i+1}',
                    project=project,
                    assigned_to=random.choice(dev_users) if dev_users else None,
                    created_by=project.project_manager,
                    status=random.choice(statuses),
                    priority=random.choice(priorities),
                    estimated_hours=Decimal(str(random.randint(4, 40))),
                    due_date=timezone.now() + timedelta(days=random.randint(1, 30)),
                    tags=['backend', 'frontend', 'bug', 'feature'][random.randint(0, 3)],
                    attachments=[],
                )
                tasks.append(task)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(tasks)} tasks'))
        return tasks

    def seed_project_feedback(self, projects, users):
        """Seed project feedback"""
        self.stdout.write('Seeding project feedback...')

        admin_users = [u for u in users if u.role == 'admin']
        statuses = ['pending', 'accepted', 'rejected']

        feedbacks = []
        for project in projects[:3]:  # Feedback for first 3 projects
            feedback = ProjectFeedback.objects.create(
                project=project,
                customer=project.customer.user,
                acceptance_status=random.choice(statuses),
                rating=random.randint(3, 5),
                feedback='Dự án được thực hiện tốt, team rất chuyên nghiệp',
                responded_by=random.choice(admin_users) if admin_users else None,
                admin_response='Cảm ơn phản hồi của quý khách',
                revision_completed=False,
            )
            feedbacks.append(feedback)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(feedbacks)} project feedbacks'))
        return feedbacks
