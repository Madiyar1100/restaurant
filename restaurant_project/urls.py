from django.contrib import admin
from django.urls import include, path

from restaurant import views


urlpatterns = [
    path("", views.index, name="index"),
    path("catalog/", views.index, name="catalog"),
    path("delivery/", views.index, name="delivery"),
    path("booking/", views.index, name="booking"),
    path("cart/", views.index, name="cart"),
    path("profile/", views.index, name="profile"),
    path("about/", views.index, name="about"),
    path("menu.pdf", views.menu_pdf, name="menu_pdf"),
    path("admin/", admin.site.urls),
    path("api/", include("restaurant.urls")),
]
