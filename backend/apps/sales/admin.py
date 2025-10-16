from django.contrib import admin
from .models import Lead, Deal


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'company_name', 'status', 'source', 'assigned_to', 'created_at']
    list_filter = ['status', 'source', 'created_at']
    search_fields = ['full_name', 'email', 'company_name']
    raw_id_fields = ['assigned_to']
    date_hierarchy = 'created_at'


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ['name', 'stage', 'amount', 'probability', 'owner', 'expected_close_date', 'created_at']
    list_filter = ['stage', 'created_at']
    search_fields = ['name', 'description']
    raw_id_fields = ['lead', 'owner']
    date_hierarchy = 'created_at'
