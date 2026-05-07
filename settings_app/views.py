from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from django.db import transaction
from .models import UniversitySettings
from .serializers import UniversitySettingsSerializer
from academics.models import Semester


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class UniversitySettingsView(APIView):
    """
    GET  /api/settings/  → all authenticated roles (used to display university name)
    PUT  /api/settings/  → admin only (full update)
    PATCH /api/settings/ → admin only (partial update)
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get(self, request):
        obj, _ = UniversitySettings.objects.get_or_create(pk=1)
        return Response(UniversitySettingsSerializer(obj).data)

    def put(self, request):
        obj, _ = UniversitySettings.objects.get_or_create(pk=1)
        serializer = UniversitySettingsSerializer(obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        obj, _ = UniversitySettings.objects.get_or_create(pk=1)
        serializer = UniversitySettingsSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SemesterRolloverView(APIView):
    """
    POST /api/settings/rollover/
    Admin-only. Transitions the active semester to the next one.

    Body (all optional):
    {
        "complete_semester": "Semester 1 2026",   // semester to mark Completed
        "activate_semester": "Semester 2 2026",   // semester to mark Active
        "advance_student_years": true             // bump Year 1→2, 2→3, etc.
    }
    """
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request):
        complete_name = request.data.get("complete_semester")
        activate_name = request.data.get("activate_semester")
        advance_years = request.data.get("advance_student_years", False)

        results = {}

        # Mark old semester as Completed
        if complete_name:
            updated = Semester.objects.filter(name=complete_name).update(status="Completed")
            results["completed"] = complete_name if updated else f"{complete_name} not found"

        # Mark new semester as Active (and demote any other Active to Upcoming)
        if activate_name:
            Semester.objects.filter(status="Active").update(status="Upcoming")
            updated = Semester.objects.filter(name=activate_name).update(status="Active")
            if updated:
                results["activated"] = activate_name
                # Update university settings
                settings_obj, _ = UniversitySettings.objects.get_or_create(pk=1)
                settings_obj.current_semester = activate_name
                settings_obj.save()
                results["current_semester_updated"] = activate_name
            else:
                results["activated"] = f"{activate_name} not found"

        # Advance student years
        if advance_years:
            from students.models import Student
            year_map = {
                "Year 1": "Year 2",
                "Year 2": "Year 3",
                "Year 3": "Year 4",
                "Year 4": "Year 5",
            }
            advanced_count = 0
            for old_year, new_year in year_map.items():
                count = Student.objects.filter(year=old_year, status="Active").update(year=new_year)
                advanced_count += count
            results["students_advanced"] = advanced_count

        # Return current state
        semesters = list(
            Semester.objects.values("id", "name", "status", "start_date", "end_date")
            .order_by("start_date")
        )
        settings_obj, _ = UniversitySettings.objects.get_or_create(pk=1)

        return Response({
            "message": "Rollover complete",
            "actions": results,
            "current_semester": settings_obj.current_semester,
            "semesters": semesters,
        })
