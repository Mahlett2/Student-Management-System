from django.urls import path
from . import views

urlpatterns = [
    # GET (all roles) / PUT / PATCH (admin only)
    path("settings/", views.UniversitySettingsView.as_view(), name="settings"),

    # POST (admin only) — semester transition
    path("settings/rollover/", views.SemesterRolloverView.as_view(), name="settings-rollover"),
]
