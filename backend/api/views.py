# backend/api/views.py

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from api.models import (
    Reservation,
    Room,
    RoomImage,
    Staff,
    Gallery,
    Food,
)

from .serializers import (
    ReservationSerializer,
    RoomSerializer,
    StaffSerializer,
    GallerySerializer,
    FoodSerializer,
)

# ---------------------------
# Reservations
# ---------------------------
@api_view(["GET", "POST"])
def list_reservations(request):
    if request.method == "GET":
        qs = Reservation.objects.all().order_by("-created_at")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status__iexact=status_filter)
        serializer = ReservationSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = ReservationSerializer(data=request.data)
    if serializer.is_valid():
        checkin = serializer.validated_data.get("checkin")
        checkout = serializer.validated_data.get("checkout")
        if checkin and checkout and checkout <= checkin:
            return Response(
                {"checkout": ["checkout must be after checkin"]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reservation = serializer.save()
        return Response(
            ReservationSerializer(reservation).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def create_reservation(request):
    serializer = ReservationSerializer(data=request.data)
    if serializer.is_valid():
        reservation = serializer.save()
        return Response(
            ReservationSerializer(reservation).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "PUT", "DELETE"])
def reservation_detail(request, pk):
    reservation = get_object_or_404(Reservation, pk=pk)

    if request.method == "GET":
        return Response(
            ReservationSerializer(reservation).data,
            status=status.HTTP_200_OK,
        )

    if request.method in ("PATCH", "PUT"):
        serializer = ReservationSerializer(
            reservation,
            data=request.data,
            partial=request.method == "PATCH",
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    reservation.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------
# Rooms
# ---------------------------
@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
def rooms_view(request):
    if request.method == "GET":
        rooms = Room.objects.all().order_by("-created_at")
        return Response(RoomSerializer(rooms, many=True).data)

    room_name = request.data.get("room_name")
    if not room_name:
        return Response(
            {"room_name": ["This field is required."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    room = Room.objects.create(
        room_name=room_name,
        description=request.data.get("description", ""),
        price=request.data.get("price", 0),
        capacity=request.data.get("capacity", 1),
    )

    for img in request.FILES.getlist("images[]"):
        RoomImage.objects.create(room=room, image=img)

    return Response(
        RoomSerializer(room).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
def room_delete(request, pk):
    room = get_object_or_404(Room, pk=pk)
    room.delete()
    return Response({"success": True}, status=status.HTTP_200_OK)


# ---------------------------
# Staff
# ---------------------------
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def staff_list_create(request):
    if request.method == "GET":
        staff = Staff.objects.all().order_by("-entry_date")
        return Response(
            StaffSerializer(staff, many=True).data,
            status=status.HTTP_200_OK,
        )

    serializer = StaffSerializer(data=request.data)
    if serializer.is_valid():
        staff = serializer.save()
        return Response(
            StaffSerializer(staff).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "PUT", "DELETE"])
@permission_classes([AllowAny])
def staff_detail(request, pk):
    staff = get_object_or_404(Staff, pk=pk)

    if request.method == "GET":
        return Response(StaffSerializer(staff).data)

    if request.method in ("PATCH", "PUT"):
        serializer = StaffSerializer(
            staff,
            data=request.data,
            partial=request.method == "PATCH",
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    staff.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------
# Gallery
# ---------------------------
@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
def gallery_list_create(request):
    if request.method == "GET":
        images = Gallery.objects.all().order_by("-uploaded_at")
        serializer = GallerySerializer(
            images,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    serializer = GallerySerializer(
        data=request.data,
        context={"request": request},
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
def gallery_delete(request, pk):
    img = get_object_or_404(Gallery, pk=pk)
    img.image.delete(save=False)
    img.delete()
    return Response({"success": True}, status=status.HTTP_200_OK)


# ---------------------------
# Food ✅ FIXED
# ---------------------------
@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
def food_list_create(request):
    if request.method == "GET":
        foods = Food.objects.all().order_by("-created_at")
        serializer = FoodSerializer(
            foods,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = FoodSerializer(
        data=request.data,
        context={"request": request},
    )
    if serializer.is_valid():
        serializer.save()
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
def food_delete(request, pk):
    food = get_object_or_404(Food, pk=pk)
    food.image.delete(save=False)  # delete image file
    food.delete()
    return Response({"success": True}, status=status.HTTP_200_OK)

# ---------------------------
# Food Delete
# ---------------------------
@api_view(["DELETE"])
def food_delete(request, pk):
    food = get_object_or_404(Food, pk=pk)

    # delete image file from storage
    if food.image:
        food.image.delete(save=False)

    food.delete()
    return Response(
        {"success": True},
        status=status.HTTP_200_OK
    )

