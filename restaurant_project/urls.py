from django.contrib import admin
from django.urls import include, path

from restaurant import views


urlpatterns = [
    path("", views.index, name="index"),
    path("menu.pdf", views.menu_pdf, name="menu_pdf"),
    path("admin/", admin.site.urls),
    path("api/", include("restaurant.urls")),
]
