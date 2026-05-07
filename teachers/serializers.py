import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Teacher, TeacherProfile
from academics.models import Department

User = get_user_model()


class DepartmentField(serializers.Field):
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


class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        exclude = ["teacher"]


class TeacherSerializer(serializers.ModelSerializer):
    """
    Admin only needs to supply full_name, initial_password, and teaching assignment.
    - username is auto-derived as firstname.fathername (lowercase)
    - teacher_id is auto-generated as TCH-XXXX
    - email is optional (teacher fills it in their profile later)
    """
    department_name = serializers.CharField(source="department.name", read_only=True)
    department = DepartmentField(required=False, allow_null=True)
    profile = TeacherProfileSerializer(read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    initial_password = serializers.CharField(
        write_only=True, required=True,
        help_text="Password set by admin. All teachers can use this to log in."
    )

    class Meta:
        model = Teacher
        fields = "__all__"
        read_only_fields = ["user"]
        extra_kwargs = {
            "teacher_id": {"required": False, "allow_blank": True, "validators": []},
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
        return re.sub(r"[^a-z0-9.]", "", base)

    def _ensure_unique_username(self, base: str) -> str:
        username = base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
        return username

    def _generate_teacher_id(self) -> str:
        """Auto-generate a unique teacher ID like TCH-0001."""
        count = Teacher.objects.count() + 1
        while True:
            tid = f"TCH-{count:04d}"
            if not Teacher.objects.filter(teacher_id=tid).exists():
                return tid
            count += 1

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("initial_password")
        full_name = validated_data.get("full_name", "")
        email = validated_data.get("email") or None

        # Auto-derive username
        base_username = self._derive_username(full_name)
        username = self._ensure_unique_username(base_username)

        # Auto-generate teacher_id if not provided
        if not validated_data.get("teacher_id"):
            validated_data["teacher_id"] = self._generate_teacher_id()

        # Store null for empty email
        validated_data["email"] = email

        user = User.objects.create_user(
            username=username,
            password=password,
            full_name=full_name,
            email=email or "",
            role=User.TEACHER,
        )
        validated_data["user"] = user
        return super().create(validated_data)
    @transaction.atomic
    def update(self, instance, validated_data):
        validated_data.pop("initial_password", None)
        teacher = super().update(instance, validated_data)
        if teacher.user:
            changed = False
            if "full_name" in validated_data:
                teacher.user.full_name = validated_data["full_name"]
                changed = True
            if "email" in validated_data and validated_data["email"]:
                teacher.user.email = validated_data["email"]
                changed = True
            if changed:
                teacher.user.save()
        return teacher
