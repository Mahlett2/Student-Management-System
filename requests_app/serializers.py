from rest_framework import serializers
from django.utils import timezone
from .models import AddDropRequest, CafeteriaRequest


class AddDropSerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.full_name", read_only=True
    )

    class Meta:
        model = AddDropRequest
        fields = "__all__"
        read_only_fields = [
            "student", "student_name", "student_code",
            "status", "submitted_at", "reviewed_at", "reviewed_by",
        ]


class AddDropReviewSerializer(serializers.ModelSerializer):
    """Admin-only: update status only."""
    class Meta:
        model = AddDropRequest
        fields = ["status"]


class CafeteriaSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.full_name", read_only=True
    )

    class Meta:
        model = CafeteriaRequest
        fields = "__all__"
        read_only_fields = [
            "student", "student_name", "student_code",
            "status", "submitted_at", "reviewed_by",
        ]


class CafeteriaReviewSerializer(serializers.ModelSerializer):
    """Admin-only: update status only."""
    class Meta:
        model = CafeteriaRequest
        fields = ["status"]
