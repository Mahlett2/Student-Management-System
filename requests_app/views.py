from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from .models import AddDropRequest, CafeteriaRequest
from .serializers import (
    AddDropSerializer, AddDropReviewSerializer,
    CafeteriaSerializer, CafeteriaReviewSerializer,
)
from students.models import Student


# ── Permission helpers ────────────────────────────────────────────────────

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsStudentOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("student", "admin")


# ── Helpers ───────────────────────────────────────────────────────────────

def _get_student(user):
    """Return the Student linked to this user, or None."""
    try:
        return Student.objects.get(user=user)
    except Student.DoesNotExist:
        return None


# ── Add/Drop ViewSet ──────────────────────────────────────────────────────

class AddDropViewSet(viewsets.ModelViewSet):
    """
    Student → create (POST) and view own requests (GET).
    Admin   → view all requests (GET) and approve/reject (PATCH).
    No one  → delete (requests are kept for audit).
    """
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ["student_name", "subject", "student_code"]
    ordering = ["-submitted_at"]

    def get_serializer_class(self):
        # Admin uses the review serializer for PATCH
        if self.request.user.role == "admin" and self.action in ("partial_update", "update"):
            return AddDropReviewSerializer
        return AddDropSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsStudent()]
        if self.action == "destroy":
            return [IsStudent()]   # student can cancel pending requests
        return [IsStudentOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = AddDropRequest.objects.select_related("student", "reviewed_by").all()

        if user.role == "student":
            return qs.filter(student__user=user)

        # Admin filters
        req_status = self.request.query_params.get("status")
        req_type = self.request.query_params.get("request_type")
        if req_status:
            qs = qs.filter(status=req_status)
        if req_type:
            qs = qs.filter(request_type=req_type)
        return qs

    def perform_create(self, serializer):
        """Auto-fill student info from JWT token."""
        student = _get_student(self.request.user)
        if not student:
            raise PermissionDenied("Student profile not found.")
        serializer.save(
            student=student,
            student_name=student.full_name,
            student_code=student.student_id,
            status="Pending",
        )

    def perform_update(self, serializer):
        """Admin approves/rejects; student cannot change status."""
        user = self.request.user
        if user.role == "admin":
            new_status = self.request.data.get("status")
            if new_status not in ("Approved", "Rejected"):
                raise PermissionDenied("Status must be 'Approved' or 'Rejected'.")
            serializer.save(
                reviewed_by=user,
                reviewed_at=timezone.now(),
            )
        else:
            raise PermissionDenied("Only admins can update request status.")

    def perform_destroy(self, instance):
        """Student can only cancel their own Pending requests."""
        user = self.request.user
        if user.role == "student":
            if instance.student and instance.student.user != user:
                raise PermissionDenied("You can only cancel your own requests.")
            if instance.status != "Pending":
                raise PermissionDenied("You can only cancel Pending requests.")
        instance.delete()

    @action(detail=False, methods=["get"], url_path="pending",
            permission_classes=[IsAdmin])
    def pending(self, request):
        """GET /api/add-drop/pending/ — admin shortcut for pending requests."""
        qs = AddDropRequest.objects.filter(status="Pending").order_by("-submitted_at")
        serializer = AddDropSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})


# ── Cafeteria ViewSet ─────────────────────────────────────────────────────

class CafeteriaViewSet(viewsets.ModelViewSet):
    """
    Student → create and view own requests.
    Admin   → view all and approve/reject.
    """
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ["student_name", "student_code"]
    ordering = ["-submitted_at"]

    def get_serializer_class(self):
        if self.request.user.role == "admin" and self.action in ("partial_update", "update"):
            return CafeteriaReviewSerializer
        return CafeteriaSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsStudent()]
        if self.action == "destroy":
            return [IsStudent()]
        return [IsStudentOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = CafeteriaRequest.objects.select_related("department", "student", "reviewed_by").all()

        if user.role == "student":
            return qs.filter(student__user=user)

        # Admin filters
        req_status = self.request.query_params.get("status")
        choice = self.request.query_params.get("choice")
        dept = self.request.query_params.get("department")
        if req_status:
            qs = qs.filter(status=req_status)
        if choice:
            qs = qs.filter(choice=choice)
        if dept:
            qs = qs.filter(department_id=dept)
        return qs

    def perform_create(self, serializer):
        """Auto-fill student info from JWT token."""
        student = _get_student(self.request.user)
        if not student:
            raise PermissionDenied("Student profile not found.")
        serializer.save(
            student=student,
            student_name=student.full_name,
            student_code=student.student_id,
            department=student.department,
            year=student.year,
            semester=student.semester,
            status="Pending",
        )

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == "admin":
            new_status = self.request.data.get("status")
            if new_status not in ("Approved", "Rejected"):
                raise PermissionDenied("Status must be 'Approved' or 'Rejected'.")
            serializer.save(reviewed_by=user)
        else:
            raise PermissionDenied("Only admins can update request status.")

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == "student":
            if instance.student and instance.student.user != user:
                raise PermissionDenied("You can only cancel your own requests.")
            if instance.status != "Pending":
                raise PermissionDenied("You can only cancel Pending requests.")
        instance.delete()

    @action(detail=False, methods=["get"], url_path="pending",
            permission_classes=[IsAdmin])
    def pending(self, request):
        """GET /api/cafeteria/pending/ — admin shortcut."""
        qs = CafeteriaRequest.objects.filter(status="Pending").order_by("-submitted_at")
        serializer = CafeteriaSerializer(qs, many=True)
        return Response({"count": qs.count(), "results": serializer.data})
