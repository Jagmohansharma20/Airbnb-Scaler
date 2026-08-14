import sqlite3
from datetime import datetime, date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from auth import get_current_user
from schemas import BookingCreate, BookingOut

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    data: BookingCreate,
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()

    # 1. Check if listing exists
    cursor.execute("""
        SELECT l.*, u.name AS host_name, u.phone AS host_phone,
            COALESCE(
                (SELECT image_url FROM listing_images WHERE listing_id = l.id AND image_order = 1 LIMIT 1),
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY id ASC LIMIT 1),
                ''
            ) AS image_url
        FROM listings l
        JOIN users u ON l.host_id = u.id
        WHERE l.id = ?
    """, (data.listing_id,))
    listing = cursor.fetchone()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if "is_active" in listing.keys() and not bool(listing["is_active"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This property is currently unlisted and not accepting new reservations")

    # 2. Validate dates format and logic
    try:
        d_start = datetime.strptime(data.start_date, "%Y-%m-%d").date()
        d_end = datetime.strptime(data.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD")

    if d_end <= d_start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Check-out date must be after check-in date")

    # 3. Check guest capacity
    if data.guests < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Number of guests must be at least 1")
    if data.guests > listing["maximum_guests"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Number of guests ({data.guests}) exceeds maximum capacity of {listing['maximum_guests']}"
        )

    # 4. Check for overlapping confirmed bookings
    cursor.execute("""
        SELECT id FROM bookings
        WHERE listing_id = ?
          AND status = 'confirmed'
          AND start_date < ?
          AND end_date > ?
    """, (data.listing_id, data.end_date, data.start_date))
    overlap = cursor.fetchone()
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This home is not available for the selected dates. Please choose different dates."
        )

    # 5. Server-side price calculation
    nights = (d_end - d_start).days
    base_price = nights * float(listing["price_per_night"])
    service_fee = 1500.0  # standard service fee
    total_price = base_price + service_fee

    # 6. Insert booking
    cursor.execute("""
        INSERT INTO bookings (listing_id, user_id, start_date, end_date, guests, total_price, status)
        VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
    """, (data.listing_id, current_user["id"], data.start_date, data.end_date, data.guests, total_price))
    booking_id = cursor.lastrowid
    db.commit()

    cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
    booking = cursor.fetchone()

    return {
        "id": booking["id"],
        "listing_id": booking["listing_id"],
        "user_id": booking["user_id"],
        "house_name": listing["house_name"],
        "location": listing["location"],
        "state": listing["state"],
        "image_url": listing["image_url"],
        "start_date": booking["start_date"],
        "end_date": booking["end_date"],
        "guests": booking["guests"],
        "total_price": booking["total_price"],
        "status": booking["status"],
        "created_at": str(booking["created_at"]),
        "host_name": listing["host_name"],
        "host_phone": listing["host_phone"]
    }

@router.get("/my", response_model=List[BookingOut])
def get_my_bookings(
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("""
        SELECT 
            b.id, b.listing_id, b.user_id, b.start_date, b.end_date,
            b.guests, b.total_price, b.status, b.created_at,
            l.house_name, l.location, l.state,
            u.name AS host_name, u.phone AS host_phone,
            COALESCE(
                (SELECT image_url FROM listing_images WHERE listing_id = l.id AND image_order = 1 LIMIT 1),
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY id ASC LIMIT 1),
                ''
            ) AS image_url
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        JOIN users u ON l.host_id = u.id
        WHERE b.user_id = ?
        ORDER BY b.id DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    
    return [
        {
            "id": r["id"],
            "listing_id": r["listing_id"],
            "user_id": r["user_id"],
            "house_name": r["house_name"],
            "location": r["location"],
            "state": r["state"],
            "image_url": r["image_url"],
            "start_date": r["start_date"],
            "end_date": r["end_date"],
            "guests": r["guests"],
            "total_price": r["total_price"],
            "status": r["status"],
            "created_at": str(r["created_at"]),
            "host_name": r["host_name"],
            "host_phone": r["host_phone"]
        }
        for r in rows
    ]

@router.put("/{id}/cancel")
def cancel_booking(
    id: int,
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM bookings WHERE id = ?", (id,))
    booking = cursor.fetchone()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own bookings")

    if booking["status"] == "cancelled":
        return {"message": "Booking is already cancelled", "status": "cancelled"}

    cursor.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", (id,))
    db.commit()

    return {"message": "Booking cancelled successfully", "status": "cancelled"}
