from rest_framework import serializers
from .models import UniversitySettings


class UniversitySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversitySettings
        fields = "__all__"
