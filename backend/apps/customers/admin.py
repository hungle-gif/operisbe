from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'industry', 'city', 'country', 'created_at']
    list_filter = ['industry', 'country', 'created_at']
    search_fields = ['user__email', 'user__full_name', 'company_name']
    raw_id_fields = ['user']
