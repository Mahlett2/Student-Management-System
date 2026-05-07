"""
Management command: python manage.py seed
Seeds the database with reference data (departments, semesters, default admin).
Safe to run multiple times — uses get_or_create.
"""

from django.core.management.base import BaseCommand
from academics.models import Department, Semester
from settings_app.models import UniversitySettings


DEPARTMENTS = [
    "Software Engineering",
    "Computer Science",
    "Information Systems",
    "Information Technology",
    "Civil Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Chemical Engineering",
]

SEMESTERS = [
    {"name": "Semester 1 2024", "start_date": "2024-09-01", "end_date": "2025-01-31", "status": "Completed"},
    {"name": "Semester 2 2024", "start_date": "2025-02-01", "end_date": "2025-06-30", "status": "Completed"},
    {"name": "Semester 1 2025", "start_date": "2025-09-01", "end_date": "2026-01-31", "status": "Completed"},
    {"name": "Semester 2 2025", "start_date": "2026-02-01", "end_date": "2026-06-30", "status": "Completed"},
    {"name": "Semester 1 2026", "start_date": "2026-09-01", "end_date": "2027-01-31", "status": "Upcoming"},
    {"name": "Semester 2 2026", "start_date": "2027-02-01", "end_date": "2027-06-30", "status": "Upcoming"},
]


class Command(BaseCommand):
    help = "Seed the database with reference data"

    def handle(self, *args, **options):
        self.stdout.write("🌱 Seeding database...")

        # Departments
        for name in DEPARTMENTS:
            dept, created = Department.objects.get_or_create(name=name)
            if created:
                self.stdout.write(f"  ✅ Department: {name}")

        # Semesters
        for s in SEMESTERS:
            sem, created = Semester.objects.get_or_create(
                name=s["name"],
                defaults={"start_date": s["start_date"], "end_date": s["end_date"], "status": s["status"]},
            )
            if created:
                self.stdout.write(f"  ✅ Semester: {s['name']}")

        # University settings
        settings, created = UniversitySettings.objects.get_or_create(pk=1)
        if created:
            self.stdout.write("  ✅ University settings created")

        # Default admin user
        from accounts.models import User
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "full_name": "Super Administrator",
                "email": "admin@university.edu",
                "role": User.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("Admin@123!")
            admin.save()
            self.stdout.write("  ✅ Admin user created  (username: admin  password: Admin@123!)")
        else:
            self.stdout.write("  ℹ️  Admin user already exists")

        self.stdout.write(self.style.SUCCESS("\n✅ Seed complete!"))
