from django.db import models
from django.conf import settings
from academics.models import Department


class Student(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"), ("Inactive", "Inactive"),
        ("Graduated", "Graduated"), ("Suspended", "Suspended"),
    ]
    CAFETERIA_CHOICES = [("Cafe", "Cafe"), ("Non-Cafe", "Non-Cafe")]
    GENDER_CHOICES = [("Male", "Male"), ("Female", "Female")]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name="student_profile"
    )
    student_id = models.CharField(max_length=20, unique=True)  # WOUR/XXXX/YY
    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="students")
    year = models.CharField(max_length=20, blank=True)
    section = models.CharField(max_length=20, blank=True)  # e.g. "Section A"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    dob = models.DateField(null=True, blank=True)
    address = models.CharField(max_length=300, blank=True)
    enrollment_date = models.DateField(null=True, blank=True)
    cafeteria = models.CharField(max_length=20, choices=CAFETERIA_CHOICES, blank=True)
    semester = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "students"
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} ({self.student_id})"


class StudentProfile(models.Model):
    """Extended personal/demographic info — maps to manually-created student_profiles table."""
    GENDER_CHOICES = [("Male", "Male"), ("Female", "Female"), ("Other", "Other")]
    MARITAL_CHOICES = [("Single", "Single"), ("Married", "Married"), ("Divorced", "Divorced"), ("Widowed", "Widowed")]

    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="profile")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    dob = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=50, blank=True)
    religion = models.CharField(max_length=50, blank=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_CHOICES, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)
    kebele = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "student_profiles"

    def __str__(self):
        return f"Profile of {self.student.full_name}"


class StudentHealth(models.Model):
    """Health information — maps to manually-created student_health table."""
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="health")
    disability = models.CharField(max_length=50, blank=True)
    chronic_illness = models.CharField(max_length=100, blank=True)
    allergies = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "student_health"

    def __str__(self):
        return f"Health of {self.student.full_name}"
