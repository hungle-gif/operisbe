from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'customer', 'project_manager', 'status', 'priority', 'start_date', 'end_date']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['name', 'customer__company_name', 'customer__user__full_name']
    raw_id_fields = ['customer', 'project_manager']
    filter_horizontal = ['team_members']
    date_hierarchy = 'created_at'
