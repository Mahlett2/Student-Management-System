"""
Root URL configuration for the Student Management System API.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "status": "✅ Student Management API is running",
        "version": "1.0",
        "endpoints": {
            "login":         "/api/auth/login/",
            "me":            "/api/auth/me/",
            "departments":   "/api/departments/",
            "semesters":     "/api/semesters/",
            "subjects":      "/api/subjects/",
            "classes":       "/api/classes/",
            "timetable":     "/api/timetable/",
            "students":      "/api/students/",
            "teachers":      "/api/teachers/",
            "results":       "/api/results/",
            "attendance":    "/api/attendance/sessions/",
            "add_drop":      "/api/add-drop/",
            "cafeteria":     "/api/cafeteria/",
            "announcements": "/api/announcements/",
            "settings":      "/api/settings/",
            "admin_panel":   "/admin/",
        }
    })

urlpatterns = [
    path("", api_root, name="api-root"),          # ← public status page
    path("admin/", admin.site.urls),

    # Auth
    path("api/auth/", include("accounts.urls")),

    # Academic reference data
    path("api/", include("academics.urls")),

    # People
    path("api/", include("students.urls")),
    path("api/", include("teachers.urls")),

    # Records
    path("api/", include("results.urls")),
    path("api/", include("attendance.urls")),

    # Requests
    path("api/", include("requests_app.urls")),

    # Communication
    path("api/", include("announcements.urls")),

    # Settings
    path("api/", include("settings_app.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
