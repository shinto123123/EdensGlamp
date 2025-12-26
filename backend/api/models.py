from django.db import models

# ------------------------
# Reservation
# ------------------------
class Reservation(models.Model):
    STATUS_PENDING = "Pending"
    STATUS_CONFIRMED = "Confirmed"
    STATUS_CANCELLED = "Cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)

    adults = models.PositiveIntegerField(default=1)
    children = models.PositiveIntegerField(default=0)

    checkin = models.DateField()
    checkout = models.DateField()

    room_type = models.CharField(max_length=100, blank=True, default="")
    rooms = models.PositiveIntegerField(default=1)

    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking by {self.name}"


# ------------------------
# Room
# ------------------------
class Room(models.Model):
    room_name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    capacity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.room_name


class RoomImage(models.Model):
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="room_images/")

    def __str__(self):
        return f"{self.room.room_name} Image"


# ------------------------
# Staff
# ------------------------
class Staff(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)

    entry_date = models.DateField(auto_now_add=True)
    resign_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.username


# ------------------------
# Gallery
# ------------------------
class Gallery(models.Model):
    image = models.ImageField(upload_to="gallery/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Gallery Image {self.id}"


class Food(models.Model):
    CATEGORY_CHOICES = [
        ("bread", "Bread"),
        ("drinks", "Drinks"),
        ("veg", "Veg"),
        ("non-veg", "Non Veg"),
        ("dessert", "Dessert"),
    ]

    name = models.CharField(max_length=150)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    price = models.DecimalField(max_digits=8, decimal_places=2)  # ✅ ADD THIS
    image = models.ImageField(upload_to="food/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

