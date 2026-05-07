from django.db import models
from django.conf import settings
from academics.models import Department


class Teacher(models.Model):
    GENDER_CHOICES = [("Male", "Male"), ("Female", "Female")]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name="teacher_profile"
    )
    teacher_id = models.CharField(max_length=50, unique=True, blank=True)
    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="teachers")
    # Teaching assignment fields
    assigned_department = models.CharField(max_length=100, blank=True)
    assigned_section = models.CharField(max_length=20, blank=True)
    assigned_subject = models.CharField(max_length=200, blank=True)
    assigned_semester = models.CharField(max_length=20, blank=True)
    assigned_year = models.CharField(max_length=20, blank=True)   # e.g. "Year 1", "Year 2"
    subject = models.CharField(max_length=200, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    dob = models.DateField(null=True, blank=True)
    address = models.CharField(max_length=300, blank=True)

    class Meta:
        db_table = "teachers"
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} ({self.teacher_id})"


class TeacherProfile(models.Model):
    """Extended teacher info — maps to manually-created teacher_profiles table."""
    QUALIFICATION_CHOICES = [
        ("BSc", "BSc"), ("MSc", "MSc"), ("PhD", "PhD"),
        ("BA", "BA"), ("MA", "MA"), ("Other", "Other"),
    ]

    teacher = models.OneToOneField(Teacher, on_delete=models.CASCADE, related_name="profile")
    gender = models.CharField(max_length=10, blank=True)
    dob = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    qualification = models.CharField(max_length=50, choices=QUALIFICATION_CHOICES, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    office_room = models.CharField(max_length=50, blank=True)
    office_hours = models.CharField(max_length=100, blank=True)
    join_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "teacher_profiles"

    def __str__(self):
        return f"Profile of {self.teacher.full_name}"
