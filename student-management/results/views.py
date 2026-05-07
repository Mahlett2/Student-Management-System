from rest_framework import viewsets, permissions, filters
from rest_framework.exceptions import PermissionDenied
from .models import Result
from .serializers import ResultSerializer
from teachers.models import Teacher


class ResultViewSet(viewsets.ModelViewSet):
    """
    - Teachers: create, edit, delete their own results.
    - Admins: read-only (list + retrieve).
    - Students: read their own results only.
    """
    serializer_class = ResultSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["student_name", "subject", "student_code"]
    ordering_fields = ["uploaded_at", "student_name", "subject", "period"]
    ordering = ["-uploaded_at"]

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Result.objects.select_related("department", "uploaded_by").all()

        if user.role == "student":
            # Students see only their own results
            return qs.filter(student__user=user)

        if user.role == "teacher":
            # Teachers see only results they uploaded
            try:
                teacher = Teacher.objects.get(user=user)
                return qs.filter(uploaded_by=teacher)
            except Teacher.DoesNotExist:
                return qs.none()

        # Admin sees everything
        dept = self.request.query_params.get("department")
        period = self.request.query_params.get("period")
        assessment = self.request.query_params.get("assessment_type")
        teacher_id = self.request.query_params.get("uploaded_by")
        if dept:
            qs = qs.filter(department_id=dept)
        if period:
            qs = qs.filter(period=period)
        if assessment:
            qs = qs.filter(assessment_type=assessment)
        if teacher_id:
            qs = qs.filter(uploaded_by_id=teacher_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != "teacher":
            raise PermissionDenied("Only teachers can upload results.")
        try:
            teacher = Teacher.objects.get(user=user)
        except Teacher.DoesNotExist:
            raise PermissionDenied("Teacher profile not found.")
        serializer.save(uploaded_by=teacher)

    def perform_update(self, serializer):
        self._check_teacher_owns(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance):
        self._check_teacher_owns(instance)
        instance.delete()

    def _check_teacher_owns(self, instance):
        user = self.request.user
        if user.role == "admin":
            raise PermissionDenied("Admins cannot modify results.")
        if user.role != "teacher":
            raise PermissionDenied("Only teachers can modify results.")
        try:
            teacher = Teacher.objects.get(user=user)
        except Teacher.DoesNotExist:
            raise PermissionDenied("Teacher profile not found.")
        if instance.uploaded_by != teacher:
            raise PermissionDenied("You can only modify your own results.")
