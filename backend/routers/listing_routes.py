import sqlite3
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from database import get_db
from auth import get_current_user, get_optional_current_user
from schemas import (
    ListingSummaryOut, ListingDetailOut, ListingCreate, ListingUpdate,
    HostInfo, BookedDateRange, ReviewOut
)

router = APIRouter(prefix="/listings", tags=["listings"])

@router.get("", response_model=List[ListingSummaryOut])
def get_listings(
    location: Optional[str] = Query(None, description="Location partial search"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    guests: Optional[int] = Query(None, ge=1, description="Number of guests"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price per night"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price per night"),
    property_type: Optional[str] = Query(None, description="Property type filter"),
    amenities: Optional[str] = Query(None, description="Comma-separated amenities (e.g. WiFi,AC)"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum average rating"),
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    query = """
        SELECT 
            l.id, l.host_id, l.house_name, l.street, l.location, l.state,
            l.price_per_night, l.maximum_guests, l.property_type, l.bathroom_type,
            COALESCE(l.is_active, 1) AS is_active,
            COALESCE(
                (SELECT image_url FROM listing_images WHERE listing_id = l.id AND image_order = 1 LIMIT 1),
                (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY id ASC LIMIT 1),
                ''
            ) AS image_url,
            (SELECT AVG(rating) FROM reviews WHERE listing_id = l.id) AS avg_rating,
            (SELECT COUNT(*) FROM reviews WHERE listing_id = l.id) AS review_count
        FROM listings l
        WHERE COALESCE(l.is_active, 1) = 1
    """
    params = []

    # 1. Location partial search (case-insensitive)
    if location and location.strip():
        loc_term = f"%{location.strip().lower()}%"
        query += " AND (LOWER(l.location) LIKE ? OR LOWER(l.state) LIKE ? OR LOWER(l.house_name) LIKE ? OR LOWER(l.street) LIKE ?)"
        params.extend([loc_term, loc_term, loc_term, loc_term])

    # 2. Guest capacity filter
    if guests and guests > 0:
        query += " AND l.maximum_guests >= ?"
        params.append(guests)

    # 3. Price range filters
    if min_price is not None and min_price > 0:
        query += " AND l.price_per_night >= ?"
        params.append(min_price)
    if max_price is not None and max_price > 0:
        query += " AND l.price_per_night <= ?"
        params.append(max_price)

    # 4. Property type filter
    if property_type and property_type.strip() and property_type.strip().lower() != 'all':
        query += " AND LOWER(l.property_type) = LOWER(?)"
        params.append(property_type.strip())

    # 5. Amenities multi-match filter (listing must satisfy all selected amenities)
    if amenities and amenities.strip():
        am_list = [a.strip().lower() for a in amenities.split(',') if a.strip()]
        if am_list:
            placeholders = ', '.join(['?'] * len(am_list))
            query += f"""
                AND (
                    SELECT COUNT(DISTINCT LOWER(a.name))
                    FROM listing_amenities la
                    JOIN amenities a ON la.amenity_id = a.id
                    WHERE la.listing_id = l.id
                      AND LOWER(a.name) IN ({placeholders})
                ) = ?
            """
            params.extend(am_list)
            params.append(len(am_list))

    # 6. Minimum Rating filter
    if min_rating is not None and min_rating > 0:
        query += " AND (SELECT AVG(rating) FROM reviews WHERE listing_id = l.id) >= ?"
        params.append(min_rating)

    # 7. Booking date overlap filtering
    if start_date and end_date:
        try:
            d_start = datetime.strptime(start_date, "%Y-%m-%d").date()
            d_end = datetime.strptime(end_date, "%Y-%m-%d").date()
            if d_end > d_start:
                # Exclude any listing that has an overlapping confirmed booking
                # Overlap condition: booking.start_date < requested_end AND booking.end_date > requested_start
                query += """
                    AND l.id NOT IN (
                        SELECT b.listing_id 
                        FROM bookings b 
                        WHERE b.status = 'confirmed' 
                          AND b.start_date < ? 
                          AND b.end_date > ?
                    )
                """
                params.extend([end_date, start_date])
        except ValueError:
            pass  # Invalid date format ignored for query or handled

    query += " ORDER BY l.id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Check user favourites if authenticated
    user_fav_ids = set()
    if current_user:
        cursor.execute("SELECT listing_id FROM favourites WHERE user_id = ?", (current_user["id"],))
        user_fav_ids = {r["listing_id"] for r in cursor.fetchall()}

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
            "property_type": r["property_type"],
            "bathroom_type": r["bathroom_type"],
            "image_url": r["image_url"],
            "rating": rating_val,
            "review_count": r["review_count"],
            "is_favourite": r["id"] in user_fav_ids,
            "is_active": bool(r["is_active"])
        })

    return results

@router.get("/{id}", response_model=ListingDetailOut)
def get_listing_detail(
    id: int,
    current_user: dict = Depends(get_current_user),  # Protected: Section 2 & 13 require auth!
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("""
        SELECT 
            l.id, l.host_id, l.house_name, l.street, l.location, l.state,
            l.description, l.price_per_night, l.maximum_guests, l.property_type,
            l.bathroom_type, COALESCE(l.is_active, 1) AS is_active, l.created_at,
            u.name AS host_name, u.email AS host_email, u.phone AS host_phone
        FROM listings l
        JOIN users u ON l.host_id = u.id
        WHERE l.id = ?
    """, (id,))
    listing = cursor.fetchone()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    # Images
    cursor.execute("""
        SELECT image_url FROM listing_images 
        WHERE listing_id = ? 
        ORDER BY image_order ASC
    """, (id,))
    images = [r["image_url"] for r in cursor.fetchall()]

    # Amenities
    cursor.execute("""
        SELECT a.name 
        FROM listing_amenities la 
        JOIN amenities a ON la.amenity_id = a.id 
        WHERE la.listing_id = ?
        ORDER BY a.name ASC
    """, (id,))
    amenities = [r["name"] for r in cursor.fetchall()]

    # Uniqueness features
    cursor.execute("""
        SELECT feature_name FROM listing_features 
        WHERE listing_id = ?
    """, (id,))
    uniqueness = [r["feature_name"] for r in cursor.fetchall()]

    # Reviews
    cursor.execute("""
        SELECT r.id, r.listing_id, r.user_id, r.rating, r.comment, r.created_at, u.name AS user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.listing_id = ?
        ORDER BY r.id DESC
    """, (id,))
    reviews_raw = cursor.fetchall()
    reviews = []
    total_rating = 0.0
    for rev in reviews_raw:
        reviews.append({
            "id": rev["id"],
            "listing_id": rev["listing_id"],
            "user_id": rev["user_id"],
            "user_name": rev["user_name"],
            "rating": rev["rating"],
            "comment": rev["comment"],
            "created_at": rev["created_at"]
        })
        total_rating += rev["rating"]
    
    avg_rating = round(total_rating / len(reviews), 1) if reviews else None

    # Favourite check
    is_favourite = False
    cursor.execute("SELECT id FROM favourites WHERE user_id = ? AND listing_id = ?", (current_user["id"], id))
    if cursor.fetchone():
        is_favourite = True

    # Booked dates (for calendar disabled dates)
    cursor.execute("""
        SELECT start_date, end_date FROM bookings 
        WHERE listing_id = ? AND status = 'confirmed'
    """, (id,))
    booked_dates = [{"start_date": r["start_date"], "end_date": r["end_date"]} for r in cursor.fetchall()]

    return {
        "id": listing["id"],
        "host_id": listing["host_id"],
        "host": {
            "id": listing["host_id"],
            "name": listing["host_name"],
            "email": listing["host_email"],
            "phone": listing["host_phone"]
        },
        "house_name": listing["house_name"],
        "street": listing["street"],
        "location": listing["location"],
        "state": listing["state"],
        "description": listing["description"],
        "price_per_night": listing["price_per_night"],
        "maximum_guests": listing["maximum_guests"],
        "property_type": listing["property_type"],
        "bathroom_type": listing["bathroom_type"],
        "images": images,
        "amenities": amenities,
        "uniqueness": uniqueness,
        "rating": avg_rating,
        "review_count": len(reviews),
        "is_favourite": is_favourite,
        "is_active": bool(listing["is_active"]),
        "booked_dates": booked_dates,
        "reviews": reviews,
        "created_at": listing["created_at"]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_listing(
    data: ListingCreate,
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()

    # Update user phone if provided
    if data.phone and data.phone.strip():
        cursor.execute("UPDATE users SET phone = ? WHERE id = ?", (data.phone.strip(), current_user["id"]))

    cursor.execute("""
        INSERT INTO listings (
            host_id, house_name, street, location, state, description,
            price_per_night, maximum_guests, property_type, bathroom_type, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        current_user["id"], data.house_name.strip(), data.street.strip(),
        data.location.strip(), data.state.strip(), data.description.strip(),
        data.price_per_night, data.maximum_guests, data.property_type, data.bathroom_type
    ))
    listing_id = cursor.lastrowid

    # Insert exactly 3 images
    for idx, img_url in enumerate(data.images[:3], start=1):
        if img_url and img_url.strip():
            cursor.execute("""
                INSERT INTO listing_images (listing_id, image_url, image_order)
                VALUES (?, ?, ?)
            """, (listing_id, img_url.strip(), idx))

    # Insert amenities
    for amenity_name in data.amenities:
        cursor.execute("INSERT OR IGNORE INTO amenities (name) VALUES (?)", (amenity_name.strip(),))
        cursor.execute("SELECT id FROM amenities WHERE name = ?", (amenity_name.strip(),))
        am_row = cursor.fetchone()
        if am_row:
            cursor.execute("""
                INSERT OR IGNORE INTO listing_amenities (listing_id, amenity_id)
                VALUES (?, ?)
            """, (listing_id, am_row["id"]))

    # Insert uniqueness features
    for feat in data.uniqueness:
        if feat and feat.strip():
            cursor.execute("""
                INSERT INTO listing_features (listing_id, feature_name)
                VALUES (?, ?)
            """, (listing_id, feat.strip()))

    # Permanently elevate user to host role upon first successful listing creation
    cursor.execute("UPDATE users SET is_host = 1 WHERE id = ?", (current_user["id"],))

    db.commit()
    return {"message": "Listing created successfully", "id": listing_id}

@router.put("/{id}")
def update_listing(
    id: int,
    data: ListingUpdate,
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT host_id FROM listings WHERE id = ?", (id,))
    listing = cursor.fetchone()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    
    if listing["host_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own listings")

    # Update fields
    fields = []
    params = []
    for field, val in [
        ("house_name", data.house_name),
        ("street", data.street),
        ("location", data.location),
        ("state", data.state),
        ("description", data.description),
        ("price_per_night", data.price_per_night),
        ("maximum_guests", data.maximum_guests),
        ("property_type", data.property_type),
        ("bathroom_type", data.bathroom_type)
    ]:
        if val is not None:
            fields.append(f"{field} = ?")
            params.append(val.strip() if isinstance(val, str) else val)

    if fields:
        fields.append("updated_at = CURRENT_TIMESTAMP")
        sql = f"UPDATE listings SET {', '.join(fields)} WHERE id = ?"
        params.append(id)
        cursor.execute(sql, params)

    # Update phone if provided
    if data.phone and data.phone.strip():
        cursor.execute("UPDATE users SET phone = ? WHERE id = ?", (data.phone.strip(), current_user["id"]))

    # Update images if provided
    if data.images is not None:
        cursor.execute("DELETE FROM listing_images WHERE listing_id = ?", (id,))
        for idx, img_url in enumerate(data.images[:3], start=1):
            if img_url and img_url.strip():
                cursor.execute("""
                    INSERT INTO listing_images (listing_id, image_url, image_order)
                    VALUES (?, ?, ?)
                """, (id, img_url.strip(), idx))

    # Update amenities if provided
    if data.amenities is not None:
        cursor.execute("DELETE FROM listing_amenities WHERE listing_id = ?", (id,))
        for amenity_name in data.amenities:
            cursor.execute("INSERT OR IGNORE INTO amenities (name) VALUES (?)", (amenity_name.strip(),))
            cursor.execute("SELECT id FROM amenities WHERE name = ?", (amenity_name.strip(),))
            am_row = cursor.fetchone()
            if am_row:
                cursor.execute("""
                    INSERT OR IGNORE INTO listing_amenities (listing_id, amenity_id)
                    VALUES (?, ?)
                """, (id, am_row["id"]))

    # Update uniqueness features if provided
    if data.uniqueness is not None:
        cursor.execute("DELETE FROM listing_features WHERE listing_id = ?", (id,))
        for feat in data.uniqueness:
            if feat and feat.strip():
                cursor.execute("""
                    INSERT INTO listing_features (listing_id, feature_name)
                    VALUES (?, ?)
                """, (id, feat.strip()))

    db.commit()
    return {"message": "Listing updated successfully"}

@router.put("/{id}/unlist")
def unlist_listing(
    id: int,
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT host_id, is_active FROM listings WHERE id = ?", (id,))
    listing = cursor.fetchone()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    
    if listing["host_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own listings")

    cursor.execute("UPDATE listings SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (id,))
    db.commit()
    return {"message": "Listing unlisted successfully", "is_active": False}

@router.delete("/{id}")
def delete_listing(
    id: int,
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT host_id FROM listings WHERE id = ?", (id,))
    listing = cursor.fetchone()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    
    if listing["host_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own listings")

    # Check if there are active / upcoming confirmed reservations (Section 18 & 19)
    cursor.execute("""
        SELECT COUNT(*) AS active_count 
        FROM bookings 
        WHERE listing_id = ? 
          AND status = 'confirmed' 
          AND end_date >= DATE('now')
    """, (id,))
    res_count = cursor.fetchone()
    if res_count and res_count["active_count"] > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This property has upcoming reservations. You cannot permanently delete it while these reservations are active. You can unlist the property instead."
        )

    # Permanently delete associated records and listing
    cursor.execute("DELETE FROM reviews WHERE listing_id = ?", (id,))
    cursor.execute("DELETE FROM favourites WHERE listing_id = ?", (id,))
    cursor.execute("DELETE FROM bookings WHERE listing_id = ?", (id,))
    cursor.execute("DELETE FROM listing_features WHERE listing_id = ?", (id,))
    cursor.execute("DELETE FROM listing_amenities WHERE listing_id = ?", (id,))
    cursor.execute("DELETE FROM listing_images WHERE listing_id = ?", (id,))
    cursor.execute("DELETE FROM listings WHERE id = ?", (id,))

    db.commit()
    return {"message": "Listing permanently deleted successfully"}
