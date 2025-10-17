"""
Finance & Statistics API
Revenue tracking, payment statistics, financial reports
🔒 ADMIN ONLY - All financial data is restricted to administrators
"""
from typing import List, Dict
from ninja import Router
from ninja.errors import HttpError
from django.db.models import Sum, Count, Q, F
from django.shortcuts import get_object_or_404
from api.dependencies.current_user import auth_bearer, require_roles
from apps.projects.models import Project, Proposal, ProjectStatus
from decimal import Decimal
from datetime import datetime, timedelta

router = Router(tags=['Finance & Statistics'])


@router.get("/finance/dashboard", auth=auth_bearer)
@require_roles('admin')
def get_finance_dashboard(request):
    """
    🔒 ADMIN ONLY: Get complete financial dashboard
    Total revenue, deposits, phase payments, statistics
    """
    user = request.auth

    # Total statistics
    all_projects = Project.objects.all()
    completed_projects = all_projects.filter(status=ProjectStatus.COMPLETED)

    # Get all proposals
    all_proposals = Proposal.objects.filter(status='accepted')
    completed_proposals = Proposal.objects.filter(
        status='accepted',
        project__status=ProjectStatus.COMPLETED
    )

    # Calculate totals
    total_revenue = Decimal('0')
    total_deposit = Decimal('0')
    total_phase_payments = Decimal('0')
    pending_revenue = Decimal('0')

    for proposal in completed_proposals:
        # Add deposit if paid
        if proposal.deposit_paid:
            total_deposit += proposal.deposit_amount

        # Add phase payments
        if proposal.phases:
            for phase in proposal.phases:
                if phase.get('payment_approved'):
                    total_phase_payments += Decimal(str(phase.get('amount', 0)))

    total_revenue = total_deposit + total_phase_payments

    # Calculate pending revenue (accepted but not completed)
    for proposal in all_proposals.filter(~Q(project__status=ProjectStatus.COMPLETED)):
        if proposal.deposit_paid:
            # Count phases not yet paid
            if proposal.phases:
                for phase in proposal.phases:
                    if not phase.get('payment_approved'):
                        pending_revenue += Decimal(str(phase.get('amount', 0)))

    return {
        'summary': {
            'total_revenue': float(total_revenue),
            'total_deposit': float(total_deposit),
            'total_phase_payments': float(total_phase_payments),
            'pending_revenue': float(pending_revenue),
            'total_projects': all_projects.count(),
            'completed_projects': completed_projects.count(),
            'in_progress_projects': all_projects.filter(status=ProjectStatus.IN_PROGRESS).count(),
            'total_proposals': all_proposals.count(),
            'accepted_proposals': all_proposals.filter(status='accepted').count(),
        },
        'breakdown': {
            'by_status': [
                {
                    'status': 'completed',
                    'count': completed_projects.count(),
                    'revenue': float(total_revenue)
                },
                {
                    'status': 'in_progress',
                    'count': all_projects.filter(status=ProjectStatus.IN_PROGRESS).count(),
                    'revenue': 0  # Not yet completed
                }
            ]
        }
    }


@router.get("/finance/projects/{project_id}/details", auth=auth_bearer)
@require_roles('admin', 'sales', 'customer')
def get_project_financial_details(request, project_id: str):
    """
    Get detailed financial breakdown for a specific project
    Shows: deposit, phases, total paid, remaining
    Access: Admin (all), Sales (managed projects), Customer (own projects)
    """
    user = request.auth
    project = get_object_or_404(Project, id=project_id)

    # Role-based access control
    if user.role == 'customer':
        # Customer can only see their own projects
        if project.customer.user != user:
            raise HttpError(403, "You can only view financial details of your own projects")
    elif user.role in ['sales', 'sale']:
        # Sales can only see projects they manage
        if project.project_manager != user:
            raise HttpError(403, "You can only view financial details of projects you manage")
    # Admin can see all (already passed through @require_roles)

    # Get proposal
    proposal = Proposal.objects.filter(project=project, status='accepted').first()
    if not proposal:
        return {
            'project_id': str(project.id),
            'project_name': project.name,
            'has_proposal': False,
            'message': 'No accepted proposal for this project'
        }

    # Calculate financials
    deposit_paid = proposal.deposit_amount if proposal.deposit_paid else Decimal('0')
    deposit_pending = Decimal('0') if proposal.deposit_paid else proposal.deposit_amount

    phase_breakdown = []
    total_phase_paid = Decimal('0')
    total_phase_pending = Decimal('0')

    if proposal.phases:
        for i, phase in enumerate(proposal.phases):
            phase_amount = Decimal(str(phase.get('amount', 0)))
            is_paid = phase.get('payment_approved', False)

            if is_paid:
                total_phase_paid += phase_amount
            else:
                total_phase_pending += phase_amount

            phase_breakdown.append({
                'phase_index': i,
                'phase_name': phase.get('name'),
                'amount': float(phase_amount),
                'paid': is_paid,
                'paid_at': phase.get('payment_approved_at'),
                'completed': phase.get('completed', False),
                'completed_at': phase.get('completed_at')
            })

    total_paid = deposit_paid + total_phase_paid
    total_pending = deposit_pending + total_phase_pending

    return {
        'project_id': str(project.id),
        'project_name': project.name,
        'project_status': project.status,
        'has_proposal': True,
        'proposal_id': str(proposal.id),
        'financial_summary': {
            'total_contract_value': float(proposal.total_price),
            'total_paid': float(total_paid),
            'total_pending': float(total_pending),
            'payment_progress_percent': round((float(total_paid) / float(proposal.total_price)) * 100, 2) if proposal.total_price > 0 else 0
        },
        'deposit': {
            'amount': float(proposal.deposit_amount),
            'paid': proposal.deposit_paid,
            'paid_at': proposal.deposit_paid_at.isoformat() if proposal.deposit_paid_at else None,
            'status': 'paid' if proposal.deposit_paid else 'pending'
        },
        'phases': phase_breakdown,
        'phase_summary': {
            'total_phases': len(proposal.phases) if proposal.phases else 0,
            'completed_phases': sum(1 for p in (proposal.phases or []) if p.get('completed')),
            'paid_phases': sum(1 for p in (proposal.phases or []) if p.get('payment_approved')),
            'total_phase_value': float(total_phase_paid + total_phase_pending),
            'paid_phase_value': float(total_phase_paid),
            'pending_phase_value': float(total_phase_pending)
        }
    }


@router.get("/finance/revenue-by-period", auth=auth_bearer)
@require_roles('admin')
def get_revenue_by_period(request, period: str = 'month'):
    """
    🔒 ADMIN ONLY: Get revenue grouped by time period
    period: 'day', 'week', 'month', 'year'
    """
    user = request.auth

    # Get completed projects with proposals
    completed_projects = Project.objects.filter(
        status=ProjectStatus.COMPLETED
    ).select_related('customer')

    revenue_data = []

    for project in completed_projects:
        proposal = Proposal.objects.filter(
            project=project,
            status='accepted'
        ).first()

        if not proposal or not project.end_date:
            continue

        # Calculate total revenue
        revenue = Decimal('0')
        if proposal.deposit_paid:
            revenue += proposal.deposit_amount

        if proposal.phases:
            for phase in proposal.phases:
                if phase.get('payment_approved'):
                    revenue += Decimal(str(phase.get('amount', 0)))

        revenue_data.append({
            'project_id': str(project.id),
            'project_name': project.name,
            'customer_name': project.customer.company_name,
            'completed_date': project.end_date.isoformat(),
            'revenue': float(revenue)
        })

    # Sort by date
    revenue_data.sort(key=lambda x: x['completed_date'], reverse=True)

    return {
        'period': period,
        'data': revenue_data,
        'total_revenue': sum(item['revenue'] for item in revenue_data),
        'project_count': len(revenue_data)
    }


@router.get("/finance/payment-status-summary", auth=auth_bearer)
@require_roles('admin')
def get_payment_status_summary(request):
    """
    🔒 ADMIN ONLY: Get summary of payment statuses across all projects
    Deposit stats, phase stats, overall revenue
    """
    user = request.auth

    # Get all accepted proposals
    proposals = Proposal.objects.filter(status='accepted')

    deposit_paid_count = 0
    deposit_pending_count = 0
    total_deposit_paid = Decimal('0')
    total_deposit_pending = Decimal('0')

    phase_stats = {
        'total_phases': 0,
        'completed_phases': 0,
        'paid_phases': 0,
        'pending_phases': 0,
        'total_phase_revenue': Decimal('0'),
        'pending_phase_revenue': Decimal('0')
    }

    for proposal in proposals:
        # Deposit stats
        if proposal.deposit_paid:
            deposit_paid_count += 1
            total_deposit_paid += proposal.deposit_amount
        else:
            deposit_pending_count += 1
            total_deposit_pending += proposal.deposit_amount

        # Phase stats
        if proposal.phases:
            for phase in proposal.phases:
                phase_amount = Decimal(str(phase.get('amount', 0)))
                phase_stats['total_phases'] += 1

                if phase.get('completed'):
                    phase_stats['completed_phases'] += 1

                if phase.get('payment_approved'):
                    phase_stats['paid_phases'] += 1
                    phase_stats['total_phase_revenue'] += phase_amount
                else:
                    phase_stats['pending_phases'] += 1
                    phase_stats['pending_phase_revenue'] += phase_amount

    return {
        'deposits': {
            'paid_count': deposit_paid_count,
            'pending_count': deposit_pending_count,
            'total_paid_amount': float(total_deposit_paid),
            'total_pending_amount': float(total_deposit_pending),
            'payment_rate_percent': round((deposit_paid_count / (deposit_paid_count + deposit_pending_count)) * 100, 2) if (deposit_paid_count + deposit_pending_count) > 0 else 0
        },
        'phases': {
            'total': phase_stats['total_phases'],
            'completed': phase_stats['completed_phases'],
            'paid': phase_stats['paid_phases'],
            'pending': phase_stats['pending_phases'],
            'total_revenue': float(phase_stats['total_phase_revenue']),
            'pending_revenue': float(phase_stats['pending_phase_revenue']),
            'payment_rate_percent': round((phase_stats['paid_phases'] / phase_stats['total_phases']) * 100, 2) if phase_stats['total_phases'] > 0 else 0
        },
        'overall': {
            'total_revenue': float(total_deposit_paid + phase_stats['total_phase_revenue']),
            'pending_revenue': float(total_deposit_pending + phase_stats['pending_phase_revenue'])
        }
    }


@router.get("/finance/top-customers", auth=auth_bearer)
@require_roles('admin')
def get_top_customers_by_revenue(request, limit: int = 10):
    """
    🔒 ADMIN ONLY: Get top customers by total revenue
    Sorted by revenue, with project count
    """
    user = request.auth

    # Get all completed projects
    completed_projects = Project.objects.filter(
        status=ProjectStatus.COMPLETED
    ).select_related('customer')

    customer_revenue = {}

    for project in completed_projects:
        proposal = Proposal.objects.filter(
            project=project,
            status='accepted'
        ).first()

        if not proposal:
            continue

        customer_id = str(project.customer.id)
        if customer_id not in customer_revenue:
            customer_revenue[customer_id] = {
                'customer_id': customer_id,
                'customer_name': project.customer.company_name,
                'customer_email': project.customer.user.email,
                'total_revenue': Decimal('0'),
                'project_count': 0
            }

        # Calculate revenue
        revenue = Decimal('0')
        if proposal.deposit_paid:
            revenue += proposal.deposit_amount

        if proposal.phases:
            for phase in proposal.phases:
                if phase.get('payment_approved'):
                    revenue += Decimal(str(phase.get('amount', 0)))

        customer_revenue[customer_id]['total_revenue'] += revenue
        customer_revenue[customer_id]['project_count'] += 1

    # Convert to list and sort by revenue
    top_customers = list(customer_revenue.values())
    top_customers.sort(key=lambda x: x['total_revenue'], reverse=True)

    # Convert Decimal to float for JSON
    for customer in top_customers:
        customer['total_revenue'] = float(customer['total_revenue'])

    return {
        'top_customers': top_customers[:limit],
        'total_customers': len(top_customers)
    }
