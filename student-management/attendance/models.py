from django.db import models
from academics.models import Department
from teachers.models import Teacher
from students.models import Student


class AttendanceSession(models.Model):
    date = models.DateField()
    class_name = models.CharField(max_length=100)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="attendance_sessions"
    )
    subject = models.CharField(max_length=200, blank=True)
    marked_by = models.ForeignKey(
        Teacher, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="attendance_sessions"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attendance_sessions"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.date} — {self.class_name}"

    @property
    def present_count(self):
        return self.records.filter(status="Present").count()

    @property
    def absent_count(self):
        return self.records.filter(status="Absent").count()

    @property
    def late_count(self):
        return self.records.filter(status="Late").count()

    @property
    def total_count(self):
        return self.records.count()


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [("Present", "Present"), ("Absent", "Absent"), ("Late", "Late")]

    session = models.ForeignKey(
        AttendanceSession, on_delete=models.CASCADE, related_name="records"
    )
    # FK to Student (optional — allows student to query their own records)
    student = models.ForeignKey(
        Student, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="attendance_records"
    )
    student_name = models.CharField(max_length=200)   # denormalised for display
    student_code = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Present")

    class Meta:
        db_table = "attendance_records"
        ordering = ["student_name"]

    def __str__(self):
        return f"{self.student_name} — {self.status}"
