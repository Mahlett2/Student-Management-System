from django.contrib import admin
from .models import UniversitySettings


@admin.register(UniversitySettings)
class UniversitySettingsAdmin(admin.ModelAdmin):
    list_display = ["university_name", "campus_name", "academic_year", "current_semester"]

    def has_add_permission(self, request):
        # Only one row allowed
        return not UniversitySettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False  # never delete the settings row
