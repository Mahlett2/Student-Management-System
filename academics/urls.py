from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("departments", views.DepartmentViewSet)
router.register("semesters", views.SemesterViewSet)
router.register("subjects", views.SubjectViewSet)
router.register("classes", views.ClassViewSet)
router.register("timetable", views.TimetableViewSet)

urlpatterns = [path("", include(router.urls))]
