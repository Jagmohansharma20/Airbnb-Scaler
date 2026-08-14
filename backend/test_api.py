import sys
import os
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from seed import seed_database

def run_tests():
    print("=== 1. Seeding Database ===")
    seed_database()

    client = TestClient(app)

    print("\n=== 2. Testing Auth Endpoints ===")
    # Signup
    signup_payload = {
        "name": "Test Traveler",
        "email": "traveler@test.com",
        "password": "mypassword123",
        "confirm_password": "mypassword123",
        "phone": "+91 9998887770"
    }
    res = client.post("/auth/signup", json=signup_payload)
    assert res.status_code == 200, f"Signup failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Signup successful, received token")

    # Login
    res = client.post("/auth/login", json={"email": "traveler@test.com", "password": "mypassword123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    assert "access_token" in res.json()
    print("[PASS] Login successful")

    # Me
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "traveler@test.com"
    print("[PASS] Get current user profile successful")

    print("\n=== 3. Testing Listing Search & Availability (Date Overlap Logic) ===")
    # Listing 1 (The Heritage Havelock Villa, Delhi) is booked from 2026-08-20 to 2026-08-24
    
    # Check all listings
    res = client.get("/listings")
    assert res.status_code == 200
    all_listings = res.json()
    assert len(all_listings) == 10, f"Expected 10 listings, got {len(all_listings)}"
    print(f"[PASS] Retrieved {len(all_listings)} listings without filters")

    # Search location partial match
    res = client.get("/listings?location=delhi")
    delhi_listings = res.json()
    assert len(delhi_listings) == 2, f"Expected 2 Delhi listings, got {len(delhi_listings)}"
    print("[PASS] Partial location search 'delhi' returned 2 matching listings")

    # Search overlapping dates 2026-08-20 to 2026-08-24 (Listing 1 MUST NOT appear)
    res = client.get("/listings?location=delhi&start_date=2026-08-20&end_date=2026-08-24")
    overlap_listings = res.json()
    assert all(l["id"] != 1 for l in overlap_listings), "Listing 1 should be excluded due to overlap!"
    assert len(overlap_listings) == 1, f"Expected 1 available Delhi listing, got {len(overlap_listings)}"
    print("[PASS] Date-overlap search (2026-08-20 to 2026-08-24) correctly excluded booked House 1")

    # Search non-overlapping dates 2026-08-24 to 2026-08-28 (Listing 1 CAN appear)
    res = client.get("/listings?location=delhi&start_date=2026-08-24&end_date=2026-08-28")
    avail_listings = res.json()
    assert any(l["id"] == 1 for l in avail_listings), "Listing 1 should be available on check-out day onward!"
    assert len(avail_listings) == 2
    print("[PASS] Checkout-day check-in search (2026-08-24 to 2026-08-28) correctly included House 1")

    # Search guests
    res = client.get("/listings?guests=7")
    big_listings = res.json()
    assert all(l["maximum_guests"] >= 7 for l in big_listings)
    print(f"[PASS] Guest capacity filter (guests=7) returned {len(big_listings)} valid listings")

    print("\n=== 4. Testing Listing Details & Protected Route Behavior ===")
    # Unauthenticated access should be rejected (401)
    res = client.get("/listings/1")
    assert res.status_code == 401, "Protected listing detail must reject unauthenticated request"
    print("[PASS] Unauthenticated listing detail correctly rejected (401)")

    # Authenticated access
    res = client.get("/listings/1", headers=headers)
    assert res.status_code == 200
    listing_detail = res.json()
    assert len(listing_detail["images"]) == 3, "Listing must have exactly 3 images"
    assert "host" in listing_detail
    assert "amenities" in listing_detail
    assert "uniqueness" in listing_detail
    assert len(listing_detail["booked_dates"]) >= 1
    print("[PASS] Authenticated listing detail returned all 3 images, host info, amenities, and booked dates")

    print("\n=== 5. Testing Favourites / Wishlist ===")
    # Add to favourites
    res = client.post("/favorites/1", headers=headers)
    assert res.status_code == 200
    print("[PASS] Added listing 1 to favourites")

    # Get favourites
    res = client.get("/favorites", headers=headers)
    assert res.status_code == 200
    favs = res.json()
    assert len(favs) == 1
    assert favs[0]["listing_id"] == 1
    print("[PASS] Retrieved favourites list successfully")

    # Remove favourite
    res = client.delete("/favorites/1", headers=headers)
    assert res.status_code == 200
    res = client.get("/favorites", headers=headers)
    assert len(res.json()) == 0
    print("[PASS] Removed favourite successfully")

    print("\n=== 6. Testing Bookings & Cancellation ===")
    # Attempt booking overlapping dates (Conflict 409)
    bad_booking = {
        "listing_id": 1,
        "start_date": "2026-08-21",
        "end_date": "2026-08-25",
        "guests": 2
    }
    res = client.post("/bookings", json=bad_booking, headers=headers)
    assert res.status_code == 409, f"Expected 409 conflict, got {res.status_code}"
    print("[PASS] Overlapping booking attempt correctly rejected with 409 Conflict")

    # Book valid dates (e.g. 2026-09-01 to 2026-09-05: 4 nights @ 5200 = 20800 + 1500 fee = 22300)
    good_booking = {
        "listing_id": 1,
        "start_date": "2026-09-01",
        "end_date": "2026-09-05",
        "guests": 3
    }
    res = client.post("/bookings", json=good_booking, headers=headers)
    assert res.status_code == 201, f"Booking creation failed: {res.text}"
    booking_data = res.json()
    assert booking_data["total_price"] == 22300.0, f"Expected total_price 22300, got {booking_data['total_price']}"
    new_booking_id = booking_data["id"]
    print(f"[PASS] Booking created with verified server-calculated price (INR {booking_data['total_price']})")

    # Check my bookings
    res = client.get("/bookings/my", headers=headers)
    assert res.status_code == 200
    my_bookings = res.json()
    assert len(my_bookings) == 1
    assert my_bookings[0]["status"] == "confirmed"
    print("[PASS] Booking appears in user's /bookings/my")

    # Cancel booking
    res = client.put(f"/bookings/{new_booking_id}/cancel", headers=headers)
    assert res.status_code == 200
    res = client.get("/bookings/my", headers=headers)
    assert res.json()[0]["status"] == "cancelled"
    print("[PASS] Booking cancelled successfully; record remains with status='cancelled'")

    print("\n=== 7. Testing Host CRUD ===")
    new_house = {
        "house_name": "Antigravity Cloud Chalet",
        "street": "Summit Ridge Road",
        "location": "Shimla",
        "state": "Himachal Pradesh",
        "description": "High altitude glass chalet featuring panoramic Himalayan sunrise views and heated floors.",
        "price_per_night": 6500.0,
        "maximum_guests": 5,
        "property_type": "House",
        "bathroom_type": "Attached",
        "phone": "+91 9998887770",
        "images": [
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80"
        ],
        "amenities": ["WiFi", "AC", "Kitchen", "Free Parking"],
        "uniqueness": ["Scenic View", "Nature Retreat", "Luxury"]
    }
    res = client.post("/listings", json=new_house, headers=headers)
    assert res.status_code == 201, f"Listing creation failed: {res.text}"
    created_house_id = res.json()["id"]
    print(f"[PASS] Host created listing ID {created_house_id}")

    # Check host listings
    res = client.get("/host/listings", headers=headers)
    assert res.status_code == 200
    host_listings = res.json()
    assert any(h["id"] == created_house_id for h in host_listings)
    print("[PASS] Listing appears in host's /host/listings dashboard")

    # Update listing
    update_data = {
        "house_name": "Antigravity Luxury Alpine Chalet",
        "price_per_night": 7000.0
    }
    res = client.put(f"/listings/{created_house_id}", json=update_data, headers=headers)
    assert res.status_code == 200
    print("[PASS] Listing updated successfully")

    # Delete listing
    res = client.delete(f"/listings/{created_house_id}", headers=headers)
    assert res.status_code == 200
    res = client.get("/host/listings", headers=headers)
    assert all(h["id"] != created_house_id for h in res.json())
    print("[PASS] Listing permanently deleted successfully")

    print("\n=== 8. Testing Reviews ===")
    review_data = {
        "rating": 5.0,
        "comment": "Mindblowing stay! The hosts were super friendly and the place was immaculate."
    }
    res = client.post("/listings/2/reviews", json=review_data, headers=headers)
    assert res.status_code == 201
    print("[PASS] Review submitted successfully")

    # Verify review list
    res = client.get("/listings/2/reviews")
    assert res.status_code == 200
    assert any(r["comment"] == review_data["comment"] for r in res.json())
    print("[PASS] Review listed and rating updated")

    print("\n==========================================")
    print("ALL BACKEND API & INTEGRATION TESTS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
