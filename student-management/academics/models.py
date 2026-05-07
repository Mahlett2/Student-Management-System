from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "departments"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Semester(models.Model):
    STATUS_CHOICES = [("Active", "Active"), ("Upcoming", "Upcoming"), ("Completed", "Completed")]
    name = models.CharField(max_length=50)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Upcoming")

    class Meta:
        db_table = "semesters"
        ordering = ["start_date"]

    def __str__(self):
        return self.name


class Subject(models.Model):
    TYPE_CHOICES = [("Core", "Core"), ("Elective", "Elective"), ("Lab", "Lab"), ("Project", "Project")]
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="subjects")
    year = models.CharField(max_length=20, blank=True)
    semester = models.CharField(max_length=20, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, blank=True)
    credits = models.PositiveSmallIntegerField(null=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "subjects"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.name}"


class Class(models.Model):
    name = models.CharField(max_length=100)
    section = models.CharField(max_length=10, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="classes")
    year = models.CharField(max_length=20, blank=True)
    semester = models.CharField(max_length=20, blank=True)
    capacity = models.PositiveSmallIntegerField(null=True, blank=True)
    room = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "classes"
        ordering = ["name", "section"]

    def __str__(self):
        return f"{self.name} {self.section}".strip()


class TimetableEntry(models.Model):
    DAY_CHOICES = [
        ("Monday", "Monday"), ("Tuesday", "Tuesday"), ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"), ("Friday", "Friday"),
    ]
    subject = models.CharField(max_length=200)
    teacher_name = models.CharField(max_length=200, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="timetable")
    class_section = models.CharField(max_length=100, blank=True)
    day = models.CharField(max_length=20, choices=DAY_CHOICES)
    time_slot = models.CharField(max_length=30)
    room = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "timetable_entries"
        ordering = ["day", "time_slot"]

    def __str__(self):
        return f"{self.day} {self.time_slot} — {self.subject}"
