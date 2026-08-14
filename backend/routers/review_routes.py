import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from auth import get_current_user
from schemas import ReviewCreate, ReviewOut

router = APIRouter(prefix="/listings", tags=["reviews"])

@router.get("/{id}/reviews", response_model=List[ReviewOut])
def get_listing_reviews(id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT r.id, r.listing_id, r.user_id, r.rating, r.comment, r.created_at, u.name AS user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.listing_id = ?
        ORDER BY r.id DESC
    """, (id,))
    rows = cursor.fetchall()
    return [
        {
            "id": r["id"],
            "listing_id": r["listing_id"],
            "user_id": r["user_id"],
            "user_name": r["user_name"],
            "rating": r["rating"],
            "comment": r["comment"],
            "created_at": str(r["created_at"])
        }
        for r in rows
    ]

@router.post("/{id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_listing_review(
    id: int,
    data: ReviewCreate,
    current_user: dict = Depends(get_current_user),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM listings WHERE id = ?", (id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    cursor.execute("""
        INSERT INTO reviews (listing_id, user_id, rating, comment)
        VALUES (?, ?, ?, ?)
    """, (id, current_user["id"], data.rating, data.comment.strip()))
    review_id = cursor.lastrowid
    db.commit()

    cursor.execute("""
        SELECT r.id, r.listing_id, r.user_id, r.rating, r.comment, r.created_at, u.name AS user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
    """, (review_id,))
    row = cursor.fetchone()

    return {
        "id": row["id"],
        "listing_id": row["listing_id"],
        "user_id": row["user_id"],
        "user_name": row["user_name"],
        "rating": row["rating"],
        "comment": row["comment"],
        "created_at": str(row["created_at"])
    }
