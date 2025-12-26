# backend/api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Rooms
    path("rooms/", views.rooms_view, name="rooms-list-create"),
    path("rooms/<int:pk>/", views.room_delete, name="rooms-delete"),

    # Reservations
    path("reservations/", views.list_reservations, name="reservations-list"),
    path("reservations/create/", views.create_reservation, name="reservations-create"),
    path("reservations/<int:pk>/", views.reservation_detail, name="reservations-detail"),

    # Staff
    path("staff/", views.staff_list_create, name="staff-list-create"),
    path("staff/<int:pk>/", views.staff_detail, name="staff-detail"),

    # Gallery
    path("gallery/", views.gallery_list_create, name="gallery-list-create"),
    path("gallery/<int:pk>/", views.gallery_delete, name="gallery-delete"),

    # Food ✅
    path("food/", views.food_list_create, name="food-list-create"),
    path("food/<int:pk>/", views.food_delete, name="food-delete"),
]
