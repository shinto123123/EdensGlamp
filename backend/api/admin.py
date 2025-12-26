# backend/api/admin.py
from django.contrib import admin
from .models import Reservation
from api.models import Room, RoomImage
from .models import Staff


admin.site.register(Room)
admin.site.register(RoomImage)

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "checkin", "checkout", "created_at")
    list_filter = ("checkin", "checkout",)
    search_fields = ("name", "email", "phone")
