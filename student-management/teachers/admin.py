from django.contrib import admin
from .models import Teacher, TeacherProfile

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ["full_name", "teacher_id", "department", "subject"]
    list_filter = ["department"]
    search_fields = ["full_name", "teacher_id", "email"]

admin.site.register(TeacherProfile)
