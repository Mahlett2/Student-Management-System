from rest_framework import viewsets, permissions
from .models import Department, Semester, Subject, Class, TimetableEntry
from .serializers import (
    DepartmentSerializer, SemesterSerializer,
    SubjectSerializer, ClassSerializer, TimetableEntrySerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admins can write; everyone else read-only."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == "admin"


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]


class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [IsAdminOrReadOnly]


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.select_related("department").all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get("department")
        if dept:
            qs = qs.filter(department_id=dept)
        return qs


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.select_related("department").all()
    serializer_class = ClassSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get("department")
        if dept:
            qs = qs.filter(department_id=dept)
        return qs


class TimetableViewSet(viewsets.ModelViewSet):
    queryset = TimetableEntry.objects.select_related("department").all()
    serializer_class = TimetableEntrySerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get("department")
        if dept:
            qs = qs.filter(department_id=dept)
        return qs
