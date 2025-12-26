# backend/api/serializers.py

from rest_framework import serializers
from django.contrib.auth.hashers import make_password

from api.models import (
    Reservation,
    Room,
    RoomImage,
    Staff,
    Gallery,
    Food,
)

# ------------------------
# Reservation
# ------------------------
class ReservationSerializer(serializers.ModelSerializer):
    check_in = serializers.DateField(source="checkin")
    check_out = serializers.DateField(source="checkout")
    message = serializers.CharField(source="notes", allow_blank=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "adults",
            "children",
            "check_in",
            "check_out",
            "room_type",
            "rooms",
            "message",
            "status",
            "created_at",
        ]
        read_only_fields = ["created_at"]


# ------------------------
# Rooms
# ------------------------
class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ["id", "image"]


class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "room_name",
            "description",
            "price",
            "capacity",
            "images",
            "created_at",
        ]


# ------------------------
# Staff
# ------------------------
class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            "id",
            "username",
            "password",
            "email",
            "phone",
            "address",
            "entry_date",
            "resign_date",
        ]
        read_only_fields = ["id", "entry_date", "resign_date"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep.pop("password", None)
        return rep

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "password" in validated_data:
            validated_data["password"] = make_password(validated_data["password"])
        return super().update(instance, validated_data)


# ------------------------
# Gallery
# ------------------------
class GallerySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Gallery
        fields = ["id", "image", "image_url", "uploaded_at"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class FoodSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Food
        fields = [
            "id",
            "name",
            "category",
            "price",        # ✅ ADD THIS
            "image",
            "image_url",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "image_url"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None
