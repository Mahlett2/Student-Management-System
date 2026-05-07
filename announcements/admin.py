from django.contrib import admin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title", "audience", "posted_by", "posted_at"]
    list_filter = ["audience", "posted_at"]
    search_fields = ["title", "body"]
    readonly_fields = ["posted_at", "posted_by"]
