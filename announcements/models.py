from django.db import models
from django.conf import settings


class Announcement(models.Model):
    AUDIENCE_CHOICES = [
        ("All", "All"), ("Students", "Students"),
        ("Teachers", "Teachers"), ("Admin", "Admin"),
    ]

    title = models.CharField(max_length=300)
    body = models.TextField()
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default="All")
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="announcements"
    )
    posted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "announcements"
        ordering = ["-posted_at"]

    def __str__(self):
        return self.title
