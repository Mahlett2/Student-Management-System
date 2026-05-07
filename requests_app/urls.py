from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("add-drop", views.AddDropViewSet, basename="add-drop")
router.register("cafeteria", views.CafeteriaViewSet, basename="cafeteria")

urlpatterns = [path("", include(router.urls))]
