import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from auth import get_current_user
from schemas import FavoriteOut

router = APIRouter(prefix="/favorites", tags=["favorites"])

@router.get("", response_model=List[FavoriteOut])
def get_my_favorites(
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("""
        SELECT 
            f.id AS fav_id, f.listing_id, f.created_at AS fav_created_at,
            l.id, l.host_id, l.house_name, l.street, l.location, l.state,
            l.price_per_night, l.maximum_guests, l.property_type, l.bathroom_type,
            COALESCE(
                (SELECT image_url FROM listing_images WHERE listing_id = l.id AND image_order = 1 LIMIT 1),
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY id ASC LIMIT 1),
                ''
            ) AS image_url,
            (SELECT AVG(rating) FROM reviews WHERE listing_id = l.id) AS avg_rating,
            (SELECT COUNT(*) FROM reviews WHERE listing_id = l.id) AS review_count
        FROM favourites f
        JOIN listings l ON f.listing_id = l.id
        WHERE f.user_id = ?
        ORDER BY f.id DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()

    results = []
    for r in rows:
        rating_val = round(r["avg_rating"], 1) if r["avg_rating"] is not None else None
        results.append({
            "id": r["fav_id"],
            "listing_id": r["listing_id"],
            "created_at": str(r["fav_created_at"]),
            "listing": {
                "id": r["id"],
                "host_id": r["host_id"],
                "house_name": r["house_name"],
                "street": r["street"],
                "location": r["location"],
                "state": r["state"],
                "price_per_night": r["price_per_night"],
                "maximum_guests": r["maximum_guests"],
                "property_type": r["property_type"],
                "bathroom_type": r["bathroom_type"],
                "image_url": r["image_url"],
                "rating": rating_val,
                "review_count": r["review_count"],
                "is_favourite": True
            }
        })

    return results

@router.post("/{listing_id}")
def add_favorite(
    listing_id: int,
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM listings WHERE id = ?", (listing_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    cursor.execute(
        "INSERT OR IGNORE INTO favourites (user_id, listing_id) VALUES (?, ?)",
        (current_user["id"], listing_id)
    )
    db.commit()
    return {"message": "Added to Wishlist", "listing_id": listing_id, "is_favourite": True}

@router.delete("/{listing_id}")
def remove_favorite(
    listing_id: int,
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute(
        "DELETE FROM favourites WHERE user_id = ? AND listing_id = ?",
        (current_user["id"], listing_id)
    )
    db.commit()
    return {"message": "Removed from Wishlist", "listing_id": listing_id, "is_favourite": False}
