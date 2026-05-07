from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Teacher, TeacherProfile
from .serializers import TeacherSerializer, TeacherProfileSerializer


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsAdminOrSelf(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "teacher")

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        return obj.user == request.user


class TeacherViewSet(viewsets.ModelViewSet):
    """
    Admin  → full CRUD on all teachers.
    Teacher → GET/PATCH own record only.
    """
    serializer_class = TeacherSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["full_name", "teacher_id", "email"]
    ordering_fields = ["full_name", "teacher_id", "department__name"]
    ordering = ["full_name"]

    def get_permissions(self):
        if self.action in ("list", "create", "destroy"):
            return [IsAdmin()]
        return [IsAdminOrSelf()]

    def get_queryset(self):
        user = self.request.user
        qs = Teacher.objects.select_related("department", "profile").all()
        if user.role == "teacher":
            return qs.filter(user=user)
        dept = self.request.query_params.get("department")
        if dept:
            qs = qs.filter(department_id=dept)
        return qs

    @action(detail=True, methods=["get", "put", "patch"],
            url_path="profile", permission_classes=[IsAdminOrSelf])
    def profile(self, request, pk=None):
        """GET/PUT /api/teachers/{id}/profile/"""
        teacher = self.get_object()
        obj, _ = TeacherProfile.objects.get_or_create(teacher=teacher)
        if request.method == "GET":
            return Response(TeacherProfileSerializer(obj).data)
        serializer = TeacherProfileSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MyTeacherProfileView(APIView):
    """
    GET   /api/teachers/me/  → logged-in teacher's full record
    PATCH /api/teachers/me/  → teacher updates their own record
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_teacher(self, request):
        try:
            return Teacher.objects.select_related("department", "profile").get(user=request.user)
        except Teacher.DoesNotExist:
            return None

    def get(self, request):
        teacher = self._get_teacher(request)
        if not teacher:
            return Response({"detail": "Teacher profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(TeacherSerializer(teacher).data)

    def patch(self, request):
        teacher = self._get_teacher(request)
        if not teacher:
            return Response({"detail": "Teacher profile not found."}, status=status.HTTP_404_NOT_FOUND)
        allowed = {k: v for k, v in request.data.items()
                   if k in ("phone", "address", "subject")}
        serializer = TeacherSerializer(teacher, data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
