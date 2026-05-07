from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("teachers", views.TeacherViewSet, basename="teacher")

urlpatterns = [
    path("teachers/me/", views.MyTeacherProfileView.as_view(), name="teacher-me"),
    path("", include(router.urls)),
]
