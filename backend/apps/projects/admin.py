from django.contrib import admin
from .models import Project, ProjectTemplate


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'customer', 'project_manager', 'status', 'priority', 'start_date', 'end_date']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['name', 'customer__company_name', 'customer__user__full_name']
    raw_id_fields = ['customer', 'project_manager']
    filter_horizontal = ['team_members']
    date_hierarchy = 'created_at'


@admin.register(ProjectTemplate)
class ProjectTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price_min', 'price_max', 'estimated_duration_min', 'is_active', 'display_order', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    list_editable = ['is_active', 'display_order']
    ordering = ['display_order', 'name']

    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('name', 'description', 'category', 'icon', 'is_active', 'display_order')
        }),
        ('Giá & Thời gian', {
            'fields': ('price_min', 'price_max', 'estimated_duration_min', 'estimated_duration_max')
        }),
        ('Chi tiết dự án', {
            'fields': ('key_features', 'deliverables', 'technologies', 'phases', 'team_structure'),
            'classes': ('collapse',)
        }),
    )
