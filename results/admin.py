from django.contrib import admin
from .models import Result

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ["student_name", "subject", "assessment_type", "score", "grade", "uploaded_by", "uploaded_at"]
    list_filter = ["assessment_type", "department", "period"]
    search_fields = ["student_name", "student_code", "subject"]
