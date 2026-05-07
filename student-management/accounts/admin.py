from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "full_name", "email", "role", "is_active"]
    list_filter = ["role", "is_active"]
    search_fields = ["username", "full_name", "email"]
    ordering = ["username"]
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal", {"fields": ("full_name", "email", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("username", "password1", "password2", "role", "full_name", "email")}),
    )
