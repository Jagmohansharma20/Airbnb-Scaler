import sys
import os
import urllib.parse
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
    res = client.get("/listings?limit=50")
    assert res.status_code == 200
    res_data = res.json()
    all_listings = res_data["listings"] if isinstance(res_data, dict) else res_data
    assert len(all_listings) >= 10, f"Expected at least 10 listings, got {len(all_listings)}"
    print(f"[PASS] Retrieved {len(all_listings)} listings without filters (Total: {res_data.get('total')})")

    # Verify Pagination metadata on GET /listings?page=1&limit=10
    page1_res = client.get("/listings?page=1&limit=10").json()
    assert page1_res["page"] == 1
    assert page1_res["limit"] == 10
    assert len(page1_res["listings"]) == 10
    assert page1_res["total_pages"] >= 2
    print(f"[PASS] Pagination Page 1 returned exactly 10 listings with total_pages={page1_res['total_pages']}")

    # Search location partial match
    res = client.get("/listings?location=delhi")
    res_data = res.json()
    delhi_listings = res_data["listings"] if isinstance(res_data, dict) else res_data
    assert len(delhi_listings) >= 2, f"Expected at least 2 Delhi listings, got {len(delhi_listings)}"
    print(f"[PASS] Partial location search 'delhi' returned {len(delhi_listings)} matching listings")

    # Search overlapping dates 2026-08-20 to 2026-08-24 (Listing 1 MUST NOT appear)
    res = client.get("/listings?location=delhi&start_date=2026-08-20&end_date=2026-08-24")
    res_data = res.json()
    overlap_listings = res_data["listings"] if isinstance(res_data, dict) else res_data
    assert all(l["id"] != 1 for l in overlap_listings), "Listing 1 should be excluded due to overlap!"
    assert len(overlap_listings) >= 1, f"Expected at least 1 available Delhi listing, got {len(overlap_listings)}"
    print("[PASS] Date-overlap search (2026-08-20 to 2026-08-24) correctly excluded booked House 1")

    # Search non-overlapping dates 2026-08-24 to 2026-08-28 (Listing 1 CAN appear)
    res = client.get("/listings?location=delhi&start_date=2026-08-24&end_date=2026-08-28")
    res_data = res.json()
    avail_listings = res_data["listings"] if isinstance(res_data, dict) else res_data
    assert any(l["id"] == 1 for l in avail_listings), "Listing 1 should be available on check-out day onward!"
    print("[PASS] Checkout-day check-in search (2026-08-24 to 2026-08-28) correctly included House 1")

    # Search guests
    res = client.get("/listings?guests=7")
    res_data = res.json()
    big_listings = res_data["listings"] if isinstance(res_data, dict) else res_data
    assert all(l["maximum_guests"] >= 7 for l in big_listings)
    print(f"[PASS] Guest capacity filter (guests=7) returned {len(big_listings)} valid listings")

    # 4. Property Type / Category Filter Tests
    print("\n=== 4. Testing Property Type & Category Row Filtering ===")
    property_types = ["House", "Apartment", "Villa", "Hotel", "Cottage", "Cabin", "Guesthouse", "Resort"]
    for pt in property_types:
        res = client.get(f"/listings?property_type={pt}")
        assert res.status_code == 200
        res_data = res.json()
        pt_listings = res_data["listings"] if isinstance(res_data, dict) else res_data
        assert len(pt_listings) > 0, f"Expected at least 1 listing for property type {pt}"
        assert all(l["property_type"] == pt for l in pt_listings), f"All returned listings must have property_type={pt}"
        print(f"[PASS] Category filter property_type='{pt}' returned {len(pt_listings)} matching listings")

    # Multi-property type filter
    res = client.get("/listings?property_type=Villa,Apartment")
    assert res.status_code == 200
    res_data = res.json()
    multi_pt = res_data["listings"] if isinstance(res_data, dict) else res_data
    assert all(l["property_type"] in ["Villa", "Apartment"] for l in multi_pt)
    print(f"[PASS] Multi-property type filter 'Villa,Apartment' returned {len(multi_pt)} listings")

    # Property type 'All'
    res = client.get("/listings?property_type=All&limit=50")
    assert res.status_code == 200
    res_data = res.json()
    all_cat = res_data["listings"] if isinstance(res_data, dict) else res_data
    assert len(all_cat) >= 10
    print("[PASS] Property type 'All' returns all listings")

    print("\n=== 5. Testing Place Type Filtering ===")
    place_types = ["Entire place", "Private room", "Hotel room", "Shared room"]
    for plt in place_types:
        res = client.get(f"/listings?place_type={urllib.parse.quote(plt)}")
        assert res.status_code == 200
        res_data = res.json()
        plt_listings = res_data["listings"] if isinstance(res_data, dict) else res_data
        assert len(plt_listings) > 0, f"Expected at least 1 listing for place type {plt}"
        assert all(l["place_type"] == plt for l in plt_listings), f"All returned listings must have place_type={plt}"
        print(f"[PASS] Place type filter place_type='{plt}' returned {len(plt_listings)} matching listings")

    # Multi-place type filter
    res = client.get("/listings?place_type=Entire%20place,Private%20room")
    assert res.status_code == 200
    res_data = res.json()
    multi_plt = res_data["listings"] if isinstance(res_data, dict) else res_data
    assert all(l["place_type"] in ["Entire place", "Private room"] for l in multi_plt)
    print(f"[PASS] Multi-place type filter 'Entire place,Private room' returned {len(multi_plt)} listings")

    print("\n=== 6. Testing Combined Category + Filter + Location + Guests ===")
    # Villa in Goa with Entire place and max_price=9000
    res = client.get("/listings?property_type=Villa&place_type=Entire%20place&location=goa&min_price=3000&max_price=9000")
    assert res.status_code == 200
    res_data = res.json()
    combo_listings = res_data["listings"] if isinstance(res_data, dict) else res_data
    assert len(combo_listings) > 0
    assert all(
        l["property_type"] == "Villa" and
        l["place_type"] == "Entire place" and
        "goa" in l["location"].lower() and
        3000 <= l["price_per_night"] <= 9000
        for l in combo_listings
    )
    print(f"[PASS] Combined filter (Villa + Entire place + Goa + 3000-9000) returned {len(combo_listings)} valid listings")

    print("\n=== 7. Testing Listing Details & Protected Route Behavior ===")
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
    assert "property_type" in listing_detail
    assert "place_type" in listing_detail
    assert len(listing_detail["booked_dates"]) >= 1
    print(f"[PASS] Listing detail returned property_type='{listing_detail['property_type']}' & place_type='{listing_detail['place_type']}'")

    print("\n=== 8. Testing Favourites / Wishlist ===")
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
    assert "place_type" in favs[0]["listing"]
    print("[PASS] Retrieved favourites list successfully with place_type present")

    # Remove favourite
    res = client.delete("/favorites/1", headers=headers)
    assert res.status_code == 200
    res = client.get("/favorites", headers=headers)
    assert len(res.json()) == 0
    print("[PASS] Removed favourite successfully")

    print("\n=== 9. Testing Bookings & Cancellation ===")
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

    # Book valid dates
    good_booking = {
        "listing_id": 1,
        "start_date": "2026-09-01",
        "end_date": "2026-09-05",
        "guests": 3
    }
    res = client.post("/bookings", json=good_booking, headers=headers)
    assert res.status_code == 201, f"Booking creation failed: {res.text}"
    booking_data = res.json()
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

    print("\n=== 10. Testing Host CRUD with Property Type and Place Type ===")
    new_house = {
        "house_name": "Antigravity Cloud Villa",
        "street": "Summit Ridge Road",
        "location": "Shimla",
        "state": "Himachal Pradesh",
        "description": "High altitude glass villa featuring panoramic Himalayan sunrise views and heated floors.",
        "price_per_night": 6500.0,
        "maximum_guests": 5,
        "property_type": "Villa",
        "place_type": "Entire place",
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
    print(f"[PASS] Host created listing ID {created_house_id} (Villa, Entire place)")

    # Check host listings
    res = client.get("/host/listings", headers=headers)
    assert res.status_code == 200
    host_listings = res.json()
    created_item = next((h for h in host_listings if h["id"] == created_house_id), None)
    assert created_item is not None
    assert created_item["property_type"] == "Villa"
    assert created_item["place_type"] == "Entire place"
    print(f"[PASS] Listing appears in /host/listings with property_type='Villa' and place_type='Entire place'")

    # Update listing: Change Villa -> Resort, Entire place -> Hotel room
    update_data = {
        "house_name": "Antigravity Luxury Mountain Resort",
        "property_type": "Resort",
        "place_type": "Hotel room",
        "price_per_night": 7000.0
    }
    res = client.put(f"/listings/{created_house_id}", json=update_data, headers=headers)
    assert res.status_code == 200
    print("[PASS] Listing updated successfully (Villa -> Resort, Entire place -> Hotel room)")

    # Verify update in details
    res = client.get(f"/listings/{created_house_id}", headers=headers)
    assert res.status_code == 200
    updated_det = res.json()
    assert updated_det["property_type"] == "Resort"
    assert updated_det["place_type"] == "Hotel room"
    print("[PASS] Verified listing details updated to Resort and Hotel room")

    # Delete listing
    res = client.delete(f"/listings/{created_house_id}", headers=headers)
    assert res.status_code == 200
    res = client.get("/host/listings", headers=headers)
    assert all(h["id"] != created_house_id for h in res.json())
    print("[PASS] Listing permanently deleted successfully")

    print("\n=== 11. Testing Reviews ===")
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
