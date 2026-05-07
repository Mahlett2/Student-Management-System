from django.contrib import admin
from .models import AddDropRequest, CafeteriaRequest


@admin.register(AddDropRequest)
class AddDropAdmin(admin.ModelAdmin):
    list_display = ["student_name", "student_code", "request_type", "subject", "status", "submitted_at"]
    list_filter = ["status", "request_type"]
    search_fields = ["student_name", "student_code", "subject"]
    readonly_fields = ["submitted_at", "reviewed_at", "reviewed_by"]


@admin.register(CafeteriaRequest)
class CafeteriaAdmin(admin.ModelAdmin):
    list_display = ["student_name", "student_code", "choice", "status", "submitted_at"]
    list_filter = ["status", "choice", "department"]
    search_fields = ["student_name", "student_code"]
    readonly_fields = ["submitted_at", "reviewed_by"]
