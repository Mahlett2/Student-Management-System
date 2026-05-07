from django.contrib import admin
from .models import Student, StudentProfile, StudentHealth

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ["full_name", "student_id", "department", "year", "status"]
    list_filter = ["department", "year", "status"]
    search_fields = ["full_name", "student_id", "email"]

admin.site.register(StudentProfile)
admin.site.register(StudentHealth)
