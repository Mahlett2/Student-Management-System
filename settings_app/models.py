from django.db import models


class UniversitySettings(models.Model):
    """Single-row settings table — always use pk=1."""
    university_name = models.CharField(max_length=200, default="Wollo University")
    campus_name = models.CharField(max_length=200, default="Kombolcha Campus")
    academic_year = models.CharField(max_length=20, blank=True)
    current_semester = models.CharField(max_length=50, blank=True)
    address = models.CharField(max_length=300, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.CharField(max_length=150, blank=True)

    class Meta:
        db_table = "university_settings"

    def __str__(self):
        return f"{self.university_name} — {self.campus_name}"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
