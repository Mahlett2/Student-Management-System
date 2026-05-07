from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Student, StudentProfile, StudentHealth
from .serializers import StudentSerializer, StudentProfileSerializer, StudentHealthSerializer


# ── Permission helpers ────────────────────────────────────────────────────

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsAdminOrSelf(permissions.BasePermission):
    """Admin: full access. Student: read/update own record only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "student")

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        # Student can only access their own record
        return obj.user == request.user


# ── Main ViewSet ──────────────────────────────────────────────────────────

class StudentViewSet(viewsets.ModelViewSet):
    """
    Admin  → full CRUD on all students.
    Student → GET/PATCH own record only (no create/delete).
    """
    serializer_class = StudentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["full_name", "student_id", "email"]
    ordering_fields = ["full_name", "student_id", "department__name", "year", "status"]
    ordering = ["full_name"]

    def get_permissions(self):
        if self.action in ("list", "create", "destroy"):
            return [IsAdmin()]
        return [IsAdminOrSelf()]

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.select_related("department", "profile", "health").all()

        # Students only see themselves
        if user.role == "student":
            return qs.filter(user=user)

        # Admin filters
        dept = self.request.query_params.get("department")
        year = self.request.query_params.get("year")
        status_param = self.request.query_params.get("status")
        if dept:
            qs = qs.filter(department_id=dept)
        if year:
            qs = qs.filter(year=year)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    # ── Sub-resource: /api/students/{id}/profile/ ────────────────────────

    @action(detail=True, methods=["get", "put", "patch"],
            url_path="profile", permission_classes=[IsAdminOrSelf])
    def profile(self, request, pk=None):
        student = self.get_object()
        obj, _ = StudentProfile.objects.get_or_create(student=student)
        if request.method == "GET":
            return Response(StudentProfileSerializer(obj).data)
        serializer = StudentProfileSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # ── Sub-resource: /api/students/{id}/health/ ─────────────────────────

    @action(detail=True, methods=["get", "put", "patch"],
            url_path="health", permission_classes=[IsAdminOrSelf])
    def health(self, request, pk=None):
        student = self.get_object()
        obj, _ = StudentHealth.objects.get_or_create(student=student)
        if request.method == "GET":
            return Response(StudentHealthSerializer(obj).data)
        serializer = StudentHealthSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ── Convenience: student reads their own profile in one call ─────────────

class MyStudentProfileView(APIView):
    """
    GET  /api/students/me/   → returns the logged-in student's full record
    PATCH /api/students/me/  → student updates their own record
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_student(self, request):
        try:
            return Student.objects.select_related(
                "department", "profile", "health"
            ).get(user=request.user)
        except Student.DoesNotExist:
            return None

    def get(self, request):
        student = self._get_student(request)
        if not student:
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(StudentSerializer(student).data)

    def patch(self, request):
        student = self._get_student(request)
        if not student:
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)
        # Students can only update limited fields
        allowed = {k: v for k, v in request.data.items()
                   if k in ("phone", "address", "cafeteria")}
        serializer = StudentSerializer(student, data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
