from rest_framework import serializers
from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.CharField(source="posted_by.full_name", read_only=True)

    class Meta:
        model = Announcement
        fields = "__all__"
        read_only_fields = ["posted_at", "posted_by"]
