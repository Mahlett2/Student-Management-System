from django.contrib import admin
from .models import AttendanceSession, AttendanceRecord


class AttendanceRecordInline(admin.TabularInline):
    model = AttendanceRecord
    extra = 0
    fields = ["student_name", "student_code", "status"]


@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ["date", "class_name", "subject", "department", "marked_by", "total_count"]
    list_filter = ["department", "date"]
    search_fields = ["class_name", "subject"]
    inlines = [AttendanceRecordInline]


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ["student_name", "student_code", "status", "session"]
    list_filter = ["status"]
    search_fields = ["student_name", "student_code"]
