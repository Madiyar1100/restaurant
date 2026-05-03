from django.urls import path

from . import views


urlpatterns = [
    path("health", views.health, name="api_health"),
    path("menu", views.menu, name="api_menu"),
    path("me", views.me, name="api_me"),
    path("register", views.register, name="api_register"),
    path("login", views.login_view, name="api_login"),
    path("logout", views.logout_view, name="api_logout"),
    path("reservations", views.reservations, name="api_reservations"),
    path("deliveries", views.deliveries, name="api_deliveries"),
    path("chat", views.chat_ai, name="api_chat_ai"),
    path("chat/operator", views.operator_thread, name="api_operator_thread"),
    path("chat/operator/messages", views.operator_messages, name="api_operator_messages"),
]
