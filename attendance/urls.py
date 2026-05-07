from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("attendance/sessions", views.AttendanceSessionViewSet, basename="attendance-session")
router.register("attendance/my", views.MyAttendanceView, basename="my-attendance")

urlpatterns = [path("", include(router.urls))]
