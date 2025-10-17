"""
Proposal API endpoints
Sale creates and sends proposals to customers for negotiation
"""
from typing import List
from ninja import Router
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from api.dependencies.current_user import auth_bearer
from apps.projects.models import Proposal, ProposalStatus, Project, ProjectStatus
from apps.projects.schemas.proposal_schema import (
    ProposalCreate,
    ProposalUpdate,
    ProposalOut,
    ProposalListOut,
    CustomerResponse
)

router = Router(tags=['Proposals'])


def serialize_proposal(proposal):
    """Helper function to serialize proposal with proper type conversion"""
    # Convert nested Decimal values in phases
    phases_data = []
    for phase in proposal.phases:
        phase_copy = phase.copy()
        if 'amount' in phase_copy:
            phase_copy['amount'] = float(phase_copy['amount']) if phase_copy['amount'] else 0
        phases_data.append(phase_copy)

    # Convert nested Decimal values in milestones
    milestones_data = []
    for milestone in proposal.milestones:
        milestone_copy = milestone.copy()
        if 'amount' in milestone_copy:
            milestone_copy['amount'] = float(milestone_copy['amount']) if milestone_copy['amount'] else 0
        milestones_data.append(milestone_copy)

    return {
        'id': str(proposal.id),
        'project_id': str(proposal.project.id),
        'created_by': {
            'id': str(proposal.created_by.id),
            'full_name': proposal.created_by.full_name,
            'email': proposal.created_by.email,
            'role': proposal.created_by.role
        },
        'project_analysis': proposal.project_analysis,
        'deposit_amount': float(proposal.deposit_amount) if proposal.deposit_amount else 0,
        'deposit_paid': proposal.deposit_paid,
        'deposit_paid_at': proposal.deposit_paid_at.isoformat() if proposal.deposit_paid_at else None,
        'payment_submitted': proposal.payment_submitted,
        'payment_submitted_at': proposal.payment_submitted_at.isoformat() if proposal.payment_submitted_at else None,
        'payment_proof': proposal.payment_proof if proposal.payment_proof else {},
        'total_price': float(proposal.total_price) if proposal.total_price else 0,
        'currency': proposal.currency,
        'estimated_start_date': proposal.estimated_start_date.isoformat() if proposal.estimated_start_date else None,
        'estimated_end_date': proposal.estimated_end_date.isoformat() if proposal.estimated_end_date else None,
        'estimated_duration_days': proposal.estimated_duration_days,
        'phases': phases_data,
        'team_members': proposal.team_members,
        'milestones': milestones_data,
        'payment_terms': proposal.payment_terms,
        'scope_of_work': proposal.scope_of_work,
        'deliverables': proposal.deliverables,
        'terms_and_conditions': proposal.terms_and_conditions,
        'warranty_terms': proposal.warranty_terms,
        'status': proposal.status,
        'customer_notes': proposal.customer_notes,
        'customer_approvals': proposal.customer_approvals if proposal.customer_approvals else {},
        'accepted_at': proposal.accepted_at.isoformat() if proposal.accepted_at else None,
        'rejected_at': proposal.rejected_at.isoformat() if proposal.rejected_at else None,
        'rejection_reason': proposal.rejection_reason,
        'valid_until': proposal.valid_until.isoformat() if proposal.valid_until else None,
        'created_at': proposal.created_at.isoformat(),
        'updated_at': proposal.updated_at.isoformat()
    }


@router.post("/projects/{project_id}/proposals", response=ProposalOut, auth=auth_bearer)
def create_proposal(request, project_id: str, payload: ProposalCreate):
    """
    Create a new proposal for a project (Sales only)
    """
    user = request.auth

    # Only sales can create proposals
    if user.role not in ['sales', 'admin']:
        raise HttpError(403, "Only sales can create proposals")

    project = get_object_or_404(Project, id=project_id)

    # Validate deposit amount
    if payload.deposit_amount < 500000:
        raise HttpError(400, "Deposit amount must be at least 500,000 VND")

    # Convert phases, team_members, and deliverables to dicts
    # IMPORTANT: Convert Decimal to float to avoid JSON serialization errors
    phases_data = []
    for p in payload.phases:
        phase_dict = p.dict()
        phase_dict['amount'] = float(phase_dict['amount']) if phase_dict.get('amount') else 0
        phases_data.append(phase_dict)

    team_members_data = [tm.dict() for tm in payload.team_members] if payload.team_members else []
    deliverables_data = [d.dict() for d in payload.deliverables] if payload.deliverables else []

    milestones_data = []
    for m in payload.milestones:
        milestone_dict = m.dict()
        milestone_dict['amount'] = float(milestone_dict['amount']) if milestone_dict.get('amount') else 0
        milestones_data.append(milestone_dict)

    proposal = Proposal.objects.create(
        project=project,
        created_by=user,
        project_analysis=payload.project_analysis,
        deposit_amount=payload.deposit_amount,
        total_price=payload.total_price,
        currency=payload.currency,
        estimated_start_date=payload.estimated_start_date,
        estimated_duration_days=payload.estimated_duration_days,
        phases=phases_data,
        team_members=team_members_data,
        deliverables=deliverables_data,
        milestones=milestones_data,
        payment_terms=payload.payment_terms,
        scope_of_work=payload.scope_of_work,
        terms_and_conditions=payload.terms_and_conditions,
        warranty_terms=payload.warranty_terms,
        valid_until=payload.valid_until,
        status=ProposalStatus.DRAFT
    )

    return serialize_proposal(proposal)


@router.get("/projects/{project_id}/proposals", response=List[ProposalOut], auth=auth_bearer)
def list_proposals(request, project_id: str):
    """
    List all proposals for a project
    Customer can only see SENT, VIEWED, ACCEPTED, REJECTED, NEGOTIATING
    Sales can see all including DRAFT
    """
    user = request.auth
    project = get_object_or_404(Project, id=project_id)

    # Check permissions for customer
    if user.role == 'customer':
        # Customer must be the project's customer
        if project.customer.user != user:
            raise HttpError(403, "Not authorized to view proposals for this project")

    proposals = Proposal.objects.filter(project=project).select_related('created_by', 'project')

    # Filter based on role
    if user.role == 'customer':
        # Customer only sees sent proposals
        proposals = proposals.exclude(status=ProposalStatus.DRAFT)

    # Return full proposal data using serialize_proposal for consistency
    result = []
    for proposal in proposals:
        result.append(serialize_proposal(proposal))

    return result


@router.get("/proposals/{proposal_id}", response=ProposalOut, auth=auth_bearer)
def get_proposal(request, proposal_id: str):
    """
    Get proposal details
    Customer viewing marks it as VIEWED
    """
    user = request.auth
    proposal = get_object_or_404(Proposal, id=proposal_id)

    # Check permissions
    if user.role == 'customer':
        # Customer must be the project's customer
        if proposal.project.customer.user != user:
            raise HttpError(403, "Not authorized to view this proposal")

        # Mark as viewed if it was sent
        if proposal.status == ProposalStatus.SENT:
            proposal.status = ProposalStatus.VIEWED
            proposal.save()

    return serialize_proposal(proposal)


@router.put("/proposals/{proposal_id}", response=ProposalOut, auth=auth_bearer)
def update_proposal(request, proposal_id: str, payload: ProposalUpdate):
    """
    Update a proposal
    - Sales: can update all fields while in DRAFT status
    - Customer: can only update customer_approvals field
    """
    user = request.auth
    proposal = get_object_or_404(Proposal, id=proposal_id)

    # Update fields
    update_data = payload.dict(exclude_unset=True)

    # Customer can only update customer_approvals
    if user.role == 'customer':
        if proposal.project.customer.user != user:
            raise HttpError(403, "Not authorized")
        # Only allow customer_approvals field
        if 'customer_approvals' in update_data:
            proposal.customer_approvals = update_data['customer_approvals']
            proposal.save()
        return serialize_proposal(proposal)

    # Sales/Admin can update all fields
    if user.role not in ['sales', 'admin']:
        raise HttpError(403, "Only sales or customer can update proposals")

    # Sales can update proposals even after sending (for inline editing flow)
    # But cannot update ACCEPTED or REJECTED proposals
    if proposal.status in [ProposalStatus.ACCEPTED, ProposalStatus.REJECTED]:
        raise HttpError(400, "Cannot update accepted or rejected proposal")

    # Convert nested objects
    if 'phases' in update_data and update_data['phases']:
        phases_data = []
        for p in update_data['phases']:
            phase_dict = p.dict() if hasattr(p, 'dict') else p
            if 'amount' in phase_dict:
                phase_dict['amount'] = float(phase_dict['amount']) if phase_dict['amount'] else 0
            phases_data.append(phase_dict)
        update_data['phases'] = phases_data

    if 'team_members' in update_data and update_data['team_members']:
        update_data['team_members'] = [tm.dict() if hasattr(tm, 'dict') else tm for tm in update_data['team_members']]

    if 'milestones' in update_data and update_data['milestones']:
        milestones_data = []
        for m in update_data['milestones']:
            milestone_dict = m.dict() if hasattr(m, 'dict') else m
            if 'amount' in milestone_dict:
                milestone_dict['amount'] = float(milestone_dict['amount']) if milestone_dict['amount'] else 0
            milestones_data.append(milestone_dict)
        update_data['milestones'] = milestones_data

    if 'deliverables' in update_data and update_data['deliverables']:
        update_data['deliverables'] = [d.dict() if hasattr(d, 'dict') else d for d in update_data['deliverables']]

    for field, value in update_data.items():
        setattr(proposal, field, value)

    proposal.save()

    return serialize_proposal(proposal)


@router.post("/proposals/{proposal_id}/send", response=ProposalOut, auth=auth_bearer)
def send_proposal(request, proposal_id: str):
    """
    Send proposal to customer (Sales only)
    Changes status from DRAFT to SENT
    """
    user = request.auth

    if user.role not in ['sales', 'admin']:
        raise HttpError(403, "Only sales can send proposals")

    proposal = get_object_or_404(Proposal, id=proposal_id)

    if proposal.status != ProposalStatus.DRAFT:
        raise HttpError(400, "Proposal has already been sent")

    proposal.status = ProposalStatus.SENT
    proposal.save()

    # TODO: Send email notification to customer

    return serialize_proposal(proposal)


@router.post("/proposals/{proposal_id}/accept", response=ProposalOut, auth=auth_bearer)
def accept_proposal(request, proposal_id: str, payload: CustomerResponse):
    """
    Customer accepts the proposal
    Changes project status to DEPOSIT (waiting for deposit payment)
    """
    user = request.auth
    proposal = get_object_or_404(Proposal, id=proposal_id)

    # Must be customer of the project
    if user.role != 'customer' or proposal.project.customer.user != user:
        raise HttpError(403, "Not authorized")

    if proposal.status in [ProposalStatus.ACCEPTED, ProposalStatus.REJECTED]:
        raise HttpError(400, "Proposal already responded to")

    proposal.status = ProposalStatus.ACCEPTED
    proposal.accepted_at = timezone.now()
    proposal.customer_notes = payload.customer_notes
    proposal.save()

    # Update project status to DEPOSIT (waiting for payment)
    proposal.project.status = ProjectStatus.DEPOSIT
    proposal.project.save()

    return serialize_proposal(proposal)


@router.post("/proposals/{proposal_id}/reject", response=ProposalOut, auth=auth_bearer)
def reject_proposal(request, proposal_id: str, payload: CustomerResponse):
    """
    Customer rejects the proposal
    Changes status to NEGOTIATING (continue discussion)
    """
    user = request.auth
    proposal = get_object_or_404(Proposal, id=proposal_id)

    # Must be customer of the project
    if user.role != 'customer' or proposal.project.customer.user != user:
        raise HttpError(403, "Not authorized")

    if proposal.status in [ProposalStatus.ACCEPTED, ProposalStatus.REJECTED]:
        raise HttpError(400, "Proposal already responded to")

    proposal.status = ProposalStatus.NEGOTIATING
    proposal.rejected_at = timezone.now()
    proposal.rejection_reason = payload.rejection_reason
    proposal.customer_notes = payload.customer_notes
    proposal.save()

    return serialize_proposal(proposal)


@router.post("/proposals/{proposal_id}/submit-payment", response=ProposalOut, auth=auth_bearer)
def submit_payment(request, proposal_id: str):
    """
    Customer submits deposit payment (AUTO APPROVED)

    Flow (SIMPLIFIED - AUTO APPROVE):
    1. Customer clicks "Đã Thanh Toán" → AUTO APPROVED
    2. Project starts immediately
    3. deposit_paid = True (no admin approval needed)

    This design supports future SePay integration where webhook will verify
    """
    user = request.auth
    proposal = get_object_or_404(Proposal, id=proposal_id)

    # Must be customer of the project
    if user.role != 'customer' or proposal.project.customer.user != user:
        raise HttpError(403, "Not authorized")

    # Proposal must be accepted
    if proposal.status != ProposalStatus.ACCEPTED:
        raise HttpError(400, "Proposal must be accepted first")

    # Already paid
    if proposal.deposit_paid:
        raise HttpError(400, "Deposit already paid")

    # Mark payment as SUBMITTED AND AUTO-APPROVE
    now = timezone.now()
    proposal.payment_submitted = True
    proposal.payment_submitted_at = now
    proposal.deposit_paid = True  # AUTO APPROVE
    proposal.deposit_paid_at = now

    # Store payment info with auto-approve flag
    proposal.payment_proof = {
        'submitted_by': str(user.id),
        'submitted_at': now.isoformat(),
        'approved_by': str(user.id),
        'approved_at': now.isoformat(),
        'approved_by_name': user.full_name,
        'amount': str(proposal.deposit_amount),
        'status': 'approved',
        'auto_approved': True  # Flag to indicate auto-approval
    }

    proposal.save()

    # Start the project IMMEDIATELY
    proposal.project.status = ProjectStatus.IN_PROGRESS
    proposal.project.start_date = now.date()
    proposal.project.save()

    # 🎯 AUTO-ASSIGN DEVELOPERS WHEN DEPOSIT IS APPROVED
    from apps.projects.services.project_service import ProjectService
    assigned_devs = ProjectService.auto_assign_on_deposit_approval(proposal.project)

    return serialize_proposal(proposal)


# NOTE: approve-payment and reject-payment endpoints removed
# Deposit payments are now AUTO-APPROVED when customer submits


@router.post("/proposals/{proposal_id}/confirm-payment", response=ProposalOut, auth=auth_bearer)
def confirm_deposit_payment(request, proposal_id: str):
    """
    [DEPRECATED] Use /approve-payment instead

    Admin/Sale confirms that deposit payment has been received
    Changes project status from DEPOSIT to IN_PROGRESS (starts project timeline)
    """
    user = request.auth

    # Only admin or sales can confirm payment
    if user.role not in ['admin', 'sales']:
        raise HttpError(403, "Only admin or sales can confirm payment")

    proposal = get_object_or_404(Proposal, id=proposal_id)

    # Proposal must be accepted
    if proposal.status != ProposalStatus.ACCEPTED:
        raise HttpError(400, "Proposal must be accepted before confirming payment")

    # Payment already confirmed
    if proposal.deposit_paid:
        raise HttpError(400, "Deposit payment already confirmed")

    # Mark deposit as paid
    proposal.deposit_paid = True
    proposal.deposit_paid_at = timezone.now()
    proposal.deposit_approved_by = user
    proposal.save()

    # Change project status to IN_PROGRESS (start project)
    proposal.project.status = ProjectStatus.IN_PROGRESS
    proposal.project.start_date = timezone.now().date()
    proposal.project.save()

    # 🎯 AUTO-ASSIGN DEVELOPERS WHEN DEPOSIT IS APPROVED
    from apps.projects.services.project_service import ProjectService
    assigned_devs = ProjectService.auto_assign_on_deposit_approval(proposal.project)

    return serialize_proposal(proposal)


# ==================== PHASE-BASED PAYMENT ENDPOINTS ====================


@router.post("/proposals/{proposal_id}/phases/{phase_index}/complete", response=ProposalOut, auth=auth_bearer)
def mark_phase_complete(request, proposal_id: str, phase_index: int):
    """
    Sales/Admin marks a phase as completed

    Flow:
    1. Sale completes phase work → Marks as complete (THIS ENDPOINT)
    2. Customer reviews completed work → Submits payment
    3. Admin approves payment → Phase paid, next phase can start
    """
    user = request.auth

    # Only sales or admin can mark phase complete
    if user.role not in ['sales', 'admin']:
        raise HttpError(403, "Only sales or admin can mark phase as complete")

    proposal = get_object_or_404(Proposal, id=proposal_id)

    # Proposal must be accepted and deposit paid
    if proposal.status != ProposalStatus.ACCEPTED:
        raise HttpError(400, "Proposal must be accepted first")

    if not proposal.deposit_paid:
        raise HttpError(400, "Deposit must be paid before starting phases")

    # Validate phase index
    if phase_index < 0 or phase_index >= len(proposal.phases):
        raise HttpError(400, f"Invalid phase index. Must be 0-{len(proposal.phases)-1}")

    # Get phase
    phases = proposal.phases
    phase = phases[phase_index]

    # Already completed
    if phase.get('completed'):
        raise HttpError(400, "Phase already marked as completed")

    # Check if previous phase is paid (except for first phase)
    if phase_index > 0:
        prev_phase = phases[phase_index - 1]
        if not prev_phase.get('payment_approved'):
            raise HttpError(400, "Previous phase payment must be approved first")

    # Mark as completed
    phase['completed'] = True
    phase['completed_at'] = timezone.now().isoformat()
    phase['completed_by'] = str(user.id)

    proposal.phases = phases
    proposal.save()

    return serialize_proposal(proposal)


@router.post("/proposals/{proposal_id}/phases/{phase_index}/submit-payment", response=ProposalOut, auth=auth_bearer)
def submit_phase_payment(request, proposal_id: str, phase_index: int):
    """
    Customer submits payment for a completed phase

    Flow (SIMPLIFIED - AUTO APPROVE):
    1. Sale marks phase complete
    2. Customer submits payment (THIS ENDPOINT)
    3. Auto-approved → Phase fully paid, next phase can start
    """
    user = request.auth
    proposal = get_object_or_404(Proposal, id=proposal_id)

    # Must be customer of the project
    if user.role != 'customer' or proposal.project.customer.user != user:
        raise HttpError(403, "Not authorized")

    # Proposal must be accepted
    if proposal.status != ProposalStatus.ACCEPTED:
        raise HttpError(400, "Proposal must be accepted first")

    # Validate phase index
    if phase_index < 0 or phase_index >= len(proposal.phases):
        raise HttpError(400, f"Invalid phase index. Must be 0-{len(proposal.phases)-1}")

    # Get phase
    phases = proposal.phases
    phase = phases[phase_index]

    # Phase must be completed by sale first
    if not phase.get('completed'):
        raise HttpError(400, "Phase must be completed by sales team first")

    # Already paid
    if phase.get('payment_approved'):
        raise HttpError(400, "Payment already approved for this phase")

    # Mark payment as submitted AND auto-approve
    now = timezone.now().isoformat()
    phase['payment_submitted'] = True
    phase['payment_submitted_at'] = now
    phase['payment_approved'] = True  # AUTO APPROVE
    phase['payment_approved_at'] = now
    phase['payment_approved_by'] = str(user.id)  # Customer approved their own payment
    phase['payment_proof'] = {
        'submitted_by': str(user.id),
        'submitted_at': now,
        'approved_by': str(user.id),
        'approved_at': now,
        'approved_by_name': user.full_name,
        'amount': str(phase.get('amount', 0)),
        'phase_name': phase.get('name'),
        'status': 'approved',
        'auto_approved': True  # Flag to indicate auto-approval
    }

    proposal.phases = phases
    proposal.save()

    # Check if this was the last phase - if so, mark project as COMPLETED
    all_phases_paid = all(p.get('payment_approved', False) for p in phases)
    if all_phases_paid:
        proposal.project.status = ProjectStatus.COMPLETED
        proposal.project.end_date = timezone.now().date()
        proposal.project.save()

    return serialize_proposal(proposal)


# NOTE: approve-payment and reject-payment endpoints removed
# Phase payments are now AUTO-APPROVED when customer submits
