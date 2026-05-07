from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # POST { username, password } → { access, refresh, user }
    path("login/", views.LoginView.as_view(), name="login"),

    # POST { refresh } → { access }
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # GET → current user profile   PATCH → update full_name / email
    path("me/", views.MeView.as_view(), name="me"),

    # POST { old_password, new_password }
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),

    # POST { refresh } → blacklists token
    path("logout/", views.LogoutView.as_view(), name="logout"),
]
