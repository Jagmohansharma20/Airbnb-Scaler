import sqlite3
from typing import List
from fastapi import APIRouter, Depends
from database import get_db
from auth import get_current_user
from schemas import ListingSummaryOut, BookingOut

router = APIRouter(prefix="/host", tags=["host"])

@router.get("/listings", response_model=List[ListingSummaryOut])
def get_host_listings(
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("""
        SELECT 
            l.id, l.host_id, l.house_name, l.street, l.location, l.state,
            l.price_per_night, l.maximum_guests,
            COALESCE(l.bedrooms, 1) AS bedrooms,
            COALESCE(l.beds, 1) AS beds,
            l.property_type,
            COALESCE(l.place_type, 'Entire place') AS place_type,
            l.bathroom_type,
            COALESCE(l.is_active, 1) AS is_active,
            COALESCE(
                (SELECT image_url FROM listing_images WHERE listing_id = l.id AND image_order = 1 LIMIT 1),
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY id ASC LIMIT 1),
                ''
            ) AS image_url,
            (SELECT AVG(rating) FROM reviews WHERE listing_id = l.id) AS avg_rating,
            (SELECT COUNT(*) FROM reviews WHERE listing_id = l.id) AS review_count
        FROM listings l
        WHERE l.host_id = ?
        ORDER BY l.id DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()

    results = []
    for r in rows:
        rating_val = round(r["avg_rating"], 1) if r["avg_rating"] is not None else None
        results.append({
            "id": r["id"],
            "host_id": r["host_id"],
            "house_name": r["house_name"],
            "street": r["street"],
            "location": r["location"],
            "state": r["state"],
            "price_per_night": r["price_per_night"],
            "maximum_guests": r["maximum_guests"],
            "bedrooms": r["bedrooms"] if "bedrooms" in r.keys() else 1,
            "beds": r["beds"] if "beds" in r.keys() else 1,
            "property_type": r["property_type"],
            "place_type": r["place_type"] if "place_type" in r.keys() else "Entire place",
            "bathroom_type": r["bathroom_type"],
            "image_url": r["image_url"],
            "rating": rating_val,
            "review_count": r["review_count"],
            "is_favourite": False,
            "is_active": bool(r["is_active"])
        })
    return results

@router.get("/bookings")
def get_host_bookings(
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("""
        SELECT 
            b.id, b.listing_id, b.user_id AS guest_id, b.start_date, b.end_date,
            b.guests,
            COALESCE(b.nights, 1) AS nights,
            COALESCE(b.price_per_night, l.price_per_night) AS price_per_night,
            COALESCE(b.base_price, b.total_price) AS base_price,
            COALESCE(b.additional_charges, 0) AS additional_charges,
            COALESCE(b.discount, 0) AS discount,
            b.total_price, b.guest_message, b.status, b.created_at,
            l.house_name, l.location, l.state, COALESCE(l.is_active, 1) AS is_active,
            u.name AS guest_name, u.email AS guest_email, u.phone AS guest_phone,
            COALESCE(
                (SELECT image_url FROM listing_images WHERE listing_id = l.id AND image_order = 1 LIMIT 1),
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY id ASC LIMIT 1),
                ''
            ) AS image_url
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        JOIN users u ON b.user_id = u.id
        WHERE l.host_id = ?
        ORDER BY b.id DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()

    return [
        {
            "id": r["id"],
            "listing_id": r["listing_id"],
            "guest_id": r["guest_id"],
            "guest_name": r["guest_name"],
            "guest_email": r["guest_email"],
            "guest_phone": r["guest_phone"],
            "house_name": r["house_name"],
            "location": r["location"],
            "state": r["state"],
            "image_url": r["image_url"],
            "start_date": r["start_date"],
            "end_date": r["end_date"],
            "guests": r["guests"],
            "nights": r["nights"] if "nights" in r.keys() else 1,
            "price_per_night": r["price_per_night"] if "price_per_night" in r.keys() else None,
            "base_price": r["base_price"] if "base_price" in r.keys() else None,
            "additional_charges": r["additional_charges"] if "additional_charges" in r.keys() else 0,
            "discount": r["discount"] if "discount" in r.keys() else 0,
            "total_price": r["total_price"],
            "guest_message": r["guest_message"] if "guest_message" in r.keys() else None,
            "status": r["status"],
            "is_active": bool(r["is_active"]),
            "created_at": str(r["created_at"]),
        }
        for r in rows
    ]
