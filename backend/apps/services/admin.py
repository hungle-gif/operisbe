from django.contrib import admin
from .models import Service, ServiceRequest


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active', 'is_featured', 'order', 'created_at']
    list_filter = ['category', 'is_active', 'is_featured', 'created_at']
    search_fields = ['name', 'slug', 'short_description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', '-is_featured', 'name']


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ['contact_name', 'service', 'customer', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['contact_name', 'contact_email', 'company_name']
    raw_id_fields = ['service', 'customer', 'assigned_to']
    date_hierarchy = 'created_at'
