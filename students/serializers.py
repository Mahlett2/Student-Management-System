import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Student, StudentProfile, StudentHealth
from academics.models import Department

User = get_user_model()


class DepartmentField(serializers.Field):
    """Accepts integer PK or string name for department."""

    def to_representation(self, value):
        return value.pk if value else None

    def to_internal_value(self, data):
        if data is None or data == "":
            return None
        if isinstance(data, int):
            try:
                return Department.objects.get(pk=data)
            except Department.DoesNotExist:
                raise serializers.ValidationError(f"Department with pk={data} does not exist.")
        if isinstance(data, str):
            obj, _ = Department.objects.get_or_create(name=data.strip())
            return obj
        raise serializers.ValidationError("Department must be an integer PK or a name string.")


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        exclude = ["student"]


class StudentHealthSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentHealth
        exclude = ["student"]


class StudentSerializer(serializers.ModelSerializer):
    """
    Admin only needs to supply full_name and student_id.
    Username is auto-derived as firstname.fathername (lowercase).
    Password defaults to the student_id.
    Student logs in with username=firstname.fathername, password=student_id.
    """
    department_name = serializers.CharField(source="department.name", read_only=True)
    department = DepartmentField(required=False, allow_null=True)
    profile = StudentProfileSerializer(read_only=True)
    health = StudentHealthSerializer(read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    # Optional override for initial password
    initial_password = serializers.CharField(
        write_only=True, required=False,
        help_text="Initial login password. Defaults to the student_id value."
    )

    class Meta:
        model = Student
        fields = "__all__"
        read_only_fields = ["user"]
        extra_kwargs = {
            "student_id": {"validators": []},
            "email": {"required": False, "allow_blank": True, "allow_null": True},
        }

    def _derive_username(self, full_name: str) -> str:
        """
        "Abebe Kebede Alemu" → "abebe.kebede"
        Uses first name + father's name, lowercase, joined by dot.
        """
        parts = full_name.strip().split()
        if len(parts) >= 2:
            base = f"{parts[0]}.{parts[1]}".lower()
        else:
            base = re.sub(r"[^a-zA-Z0-9]", "_", full_name).lower()
        # Remove any non-alphanumeric except dot
        base = re.sub(r"[^a-z0-9.]", "", base)
        return base

    def _ensure_unique_username(self, base: str) -> str:
        username = base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
        return username

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("initial_password", None)
        full_name  = validated_data.get("full_name", "")
        student_id = validated_data.get("student_id", "")
        email      = validated_data.get("email") or None

        # Auto-derive username from name
        base_username = self._derive_username(full_name)
        username = self._ensure_unique_username(base_username)

        # Default password = student_id
        user = User.objects.create_user(
            username=username,
            password=password or student_id,
            full_name=full_name,
            email=email or "",
            role=User.STUDENT,
        )
        validated_data["user"] = user
        # Don't store empty string as email — store None
        if not validated_data.get("email"):
            validated_data["email"] = None
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        validated_data.pop("initial_password", None)
        student = super().update(instance, validated_data)
        # Keep User full_name in sync
        if student.user:
            changed = False
            if "full_name" in validated_data:
                student.user.full_name = validated_data["full_name"]
                changed = True
            if "email" in validated_data and validated_data["email"]:
                student.user.email = validated_data["email"]
                changed = True
            if changed:
                student.user.save()
        return student
