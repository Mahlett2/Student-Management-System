from django.db import models
from django.conf import settings
from academics.models import Department
from students.models import Student
from teachers.models import Teacher


class Result(models.Model):
    ASSESSMENT_CHOICES = [
        ("Assignment", "Assignment"),
        ("Mid", "Mid"),
        ("Project", "Project"),
        ("Final", "Final"),
        ("Test1", "Test1"),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True, related_name="results")
    student_name = models.CharField(max_length=200)       # denormalised for display
    student_code = models.CharField(max_length=20, blank=True)  # WOUR/XXXX/YY
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="results")
    subject = models.CharField(max_length=200)
    period = models.CharField(max_length=50)              # e.g. "Semester 1 2025"
    assessment_type = models.CharField(max_length=20, choices=ASSESSMENT_CHOICES)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # numeric score
    grade = models.CharField(max_length=10, blank=True)   # letter grade (auto-computed or manual)
    uploaded_by = models.ForeignKey(
        Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="uploaded_results"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "results"
        ordering = ["-uploaded_at"]
        unique_together = [["student", "subject", "period", "assessment_type"]]

    def save(self, *args, **kwargs):
        """Auto-compute letter grade from numeric score."""
        if self.score is not None:
            n = float(self.score)
            if n > 90:    self.grade = "A+"
            elif n >= 85: self.grade = "A"
            elif n >= 80: self.grade = "A-"
            elif n >= 75: self.grade = "B+"
            elif n >= 70: self.grade = "B"
            elif n >= 65: self.grade = "B-"
            elif n >= 60: self.grade = "C+"
            elif n >= 55: self.grade = "C"
            elif n >= 50: self.grade = "C-"
            elif n >= 45: self.grade = "D"
            else:         self.grade = "F"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student_name} — {self.subject} ({self.assessment_type}): {self.grade}"
