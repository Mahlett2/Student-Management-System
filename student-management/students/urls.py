from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("students", views.StudentViewSet, basename="student")

urlpatterns = [
    # /me/ must be registered BEFORE the router so it isn't swallowed by /{pk}/
    path("students/me/", views.MyStudentProfileView.as_view(), name="student-me"),
    path("", include(router.urls)),
]
