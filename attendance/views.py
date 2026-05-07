from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count, Q
from .models import AttendanceSession, AttendanceRecord
from .serializers import (
    AttendanceSessionSerializer,
    AttendanceRecordSerializer,
    StudentAttendanceSerializer,
)
from teachers.models import Teacher
from students.models import Student


# ── Permission helpers ────────────────────────────────────────────────────

class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("teacher", "admin")


class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "teacher"


# ── Session ViewSet ───────────────────────────────────────────────────────

class AttendanceSessionViewSet(viewsets.ModelViewSet):
    """
    Teacher  → create, edit, delete their own sessions.
    Admin    → read all sessions (no create/delete).
    Student  → not allowed here; use /api/attendance/my/ instead.
    """
    serializer_class = AttendanceSessionSerializer
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ["class_name", "subject", "department__name"]
    ordering = ["-date"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsTeacher()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = (
            AttendanceSession.objects
            .select_related("department", "marked_by")
            .prefetch_related("records")
            .all()
        )

        if user.role == "teacher":
            try:
                teacher = Teacher.objects.get(user=user)
                qs = qs.filter(marked_by=teacher)
            except Teacher.DoesNotExist:
                return qs.none()

        # Admin filters
        dept = self.request.query_params.get("department")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if dept:
            qs = qs.filter(department_id=dept)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    def perform_create(self, serializer):
        """Auto-set marked_by from JWT token."""
        try:
            teacher = Teacher.objects.get(user=self.request.user)
        except Teacher.DoesNotExist:
            raise PermissionDenied("Teacher profile not found.")
        serializer.save(marked_by=teacher)

    def perform_update(self, serializer):
        """Teacher can only edit their own sessions."""
        instance = serializer.instance
        try:
            teacher = Teacher.objects.get(user=self.request.user)
        except Teacher.DoesNotExist:
            raise PermissionDenied("Teacher profile not found.")
        if instance.marked_by != teacher:
            raise PermissionDenied("You can only edit your own sessions.")
        serializer.save()

    def perform_destroy(self, instance):
        """Teacher can only delete their own sessions."""
        try:
            teacher = Teacher.objects.get(user=self.request.user)
        except Teacher.DoesNotExist:
            raise PermissionDenied("Teacher profile not found.")
        if instance.marked_by != teacher:
            raise PermissionDenied("You can only delete your own sessions.")
        instance.delete()

    @action(detail=False, methods=["get"], url_path="summary",
            permission_classes=[IsTeacherOrAdmin])
    def summary(self, request):
        """
        GET /api/attendance/sessions/summary/
        Returns per-student attendance summary across all sessions visible to the caller.
        """
        qs = self.get_queryset()
        records = AttendanceRecord.objects.filter(session__in=qs)

        # Aggregate per student
        from django.db.models import Count, Case, When, IntegerField
        summary = (
            records.values("student_name", "student_code")
            .annotate(
                total=Count("id"),
                present=Count(Case(When(status="Present", then=1), output_field=IntegerField())),
                absent=Count(Case(When(status="Absent", then=1), output_field=IntegerField())),
                late=Count(Case(When(status="Late", then=1), output_field=IntegerField())),
            )
            .order_by("student_name")
        )

        data = []
        for s in summary:
            total = s["total"]
            present = s["present"]
            rate = round((present / total) * 100, 1) if total > 0 else 0
            data.append({
                "student_name": s["student_name"],
                "student_code": s["student_code"],
                "total": total,
                "present": present,
                "absent": s["absent"],
                "late": s["late"],
                "attendance_rate": rate,
                "status": "Good" if rate >= 75 else "Low",
            })

        return Response(data)


# ── Student's own attendance ──────────────────────────────────────────────

class MyAttendanceView(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/attendance/my/         → student's own attendance records
    GET /api/attendance/my/summary/ → student's own attendance summary
    """
    serializer_class = StudentAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != "student":
            return AttendanceRecord.objects.none()
        # Match by student FK if linked, otherwise by student_code
        try:
            student = Student.objects.get(user=user)
            return (
                AttendanceRecord.objects
                .select_related("session", "session__department", "session__marked_by")
                .filter(
                    Q(student=student) | Q(student_code=student.student_id)
                )
                .order_by("-session__date")
            )
        except Student.DoesNotExist:
            return AttendanceRecord.objects.none()

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """GET /api/attendance/my/summary/"""
        records = self.get_queryset()
        total = records.count()
        present = records.filter(status="Present").count()
        absent = records.filter(status="Absent").count()
        late = records.filter(status="Late").count()
        rate = round((present / total) * 100, 1) if total > 0 else 0
        return Response({
            "total_sessions": total,
            "present": present,
            "absent": absent,
            "late": late,
            "attendance_rate": rate,
            "status": "Good" if rate >= 75 else "Low",
        })
