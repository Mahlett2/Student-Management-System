"""
Centralized permission classes for the Student Management System.
Import from here in all views:

    from core.permissions import IsAdmin, IsTeacher, IsStudent, IsOwnerOrAdmin
"""

from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only admin-role users."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsTeacher(permissions.BasePermission):
    """Only teacher-role users."""
    message = "Teacher access required."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "teacher"
        )


class IsStudent(permissions.BasePermission):
    """Only student-role users."""
    message = "Student access required."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "student"
        )


class IsAdminOrTeacher(permissions.BasePermission):
    """Admin or teacher."""
    message = "Admin or teacher access required."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("admin", "teacher")
        )


class IsAdminOrStudent(permissions.BasePermission):
    """Admin or student."""
    message = "Admin or student access required."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("admin", "student")
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Admin: full CRUD.
    Any authenticated user: read-only (GET, HEAD, OPTIONS).
    """
    message = "Admin access required for write operations."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == "admin"


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission.
    Admin: access any object.
    Others: access only objects they own.

    The view must pass the object to has_object_permission.
    The object must have a `user` attribute or a `student.user` / `teacher.user` chain.
    """
    message = "You can only access your own records."

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True

        # Direct user FK (e.g. Student.user, Teacher.user)
        if hasattr(obj, "user") and obj.user == request.user:
            return True

        # Nested: obj.student.user (e.g. AttendanceRecord, Result)
        if hasattr(obj, "student") and obj.student and obj.student.user == request.user:
            return True

        # Nested: obj.teacher.user
        if hasattr(obj, "teacher") and obj.teacher and obj.teacher.user == request.user:
            return True

        return False


class IsTeacherOwnerOrAdmin(permissions.BasePermission):
    """
    For results/attendance: teacher can only modify their own records.
    Admin: read-only.
    """
    message = "You can only modify your own records."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("admin", "teacher")
        )

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            # Admin can read but not write
            return request.method in permissions.SAFE_METHODS

        # Teacher can only touch their own records
        if hasattr(obj, "uploaded_by") and obj.uploaded_by:
            try:
                from teachers.models import Teacher
                teacher = Teacher.objects.get(user=request.user)
                return obj.uploaded_by == teacher
            except Exception:
                return False

        if hasattr(obj, "marked_by") and obj.marked_by:
            try:
                from teachers.models import Teacher
                teacher = Teacher.objects.get(user=request.user)
                return obj.marked_by == teacher
            except Exception:
                return False

        return False
