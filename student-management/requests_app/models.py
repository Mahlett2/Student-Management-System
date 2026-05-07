from django.db import models
from django.conf import settings
from academics.models import Department
from students.models import Student


class AddDropRequest(models.Model):
    TYPE_CHOICES = [("Add", "Add"), ("Drop", "Drop")]
    STATUS_CHOICES = [("Pending", "Pending"), ("Approved", "Approved"), ("Rejected", "Rejected")]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True, related_name="add_drop_requests")
    student_name = models.CharField(max_length=200)
    student_code = models.CharField(max_length=20, blank=True)
    request_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    subject = models.CharField(max_length=200)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reviewed_add_drops"
    )

    class Meta:
        db_table = "add_drop_requests"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student_name} — {self.request_type} {self.subject}"


class CafeteriaRequest(models.Model):
    CHOICE_OPTIONS = [("Cafe", "Cafe"), ("Non-Cafe", "Non-Cafe")]
    STATUS_CHOICES = [("Pending", "Pending"), ("Approved", "Approved"), ("Rejected", "Rejected")]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True, related_name="cafeteria_requests")
    student_name = models.CharField(max_length=200)
    student_code = models.CharField(max_length=20, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="cafeteria_requests")
    year = models.CharField(max_length=20, blank=True)
    semester = models.CharField(max_length=50, blank=True)
    choice = models.CharField(max_length=20, choices=CHOICE_OPTIONS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reviewed_cafeteria"
    )

    class Meta:
        db_table = "cafeteria_requests"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student_name} — {self.choice}"
