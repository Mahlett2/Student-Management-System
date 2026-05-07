from rest_framework import viewsets, permissions, filters
from rest_framework.exceptions import PermissionDenied
from .models import Announcement
from .serializers import AnnouncementSerializer


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin: full CRUD. Teachers and students: read-only."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True   # all authenticated roles can read
        return request.user.role == "admin"


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    Admin    → full CRUD, sees all announcements.
    Teacher  → read-only, sees audience=All or Teachers.
    Student  → read-only, sees audience=All or Students.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "body"]
    ordering = ["-posted_at"]

    def get_queryset(self):
        user = self.request.user
        qs = Announcement.objects.select_related("posted_by").all()

        # Audience filtering per role
        if user.role == "student":
            qs = qs.filter(audience__in=["All", "Students"])
        elif user.role == "teacher":
            qs = qs.filter(audience__in=["All", "Teachers"])
        # admin sees everything

        # Optional audience filter param (admin only)
        audience = self.request.query_params.get("audience")
        if audience and user.role == "admin":
            qs = qs.filter(audience=audience)

        return qs

    def perform_create(self, serializer):
        """Auto-set posted_by from JWT token."""
        serializer.save(posted_by=self.request.user)

    def perform_update(self, serializer):
        """Only admin can edit — already enforced by IsAdminOrReadOnly."""
        serializer.save()

    def perform_destroy(self, instance):
        """Only admin can delete."""
        instance.delete()
