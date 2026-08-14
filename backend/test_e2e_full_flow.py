import urllib.request
import json
import urllib.parse
import sys
import time

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

def make_req(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    if data is not None:
        data_bytes = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    else:
        data_bytes = None
    
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            content_type = resp.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return resp.status, json.loads(resp_body)
            return resp.status, resp_body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed

def run_e2e():
    print("===================================================================")
    print("  AIRBNB FULL E2E SUITE: GUEST & HOST ROLES, MY TRIPS, HOST BOOKINGS")
    print("===================================================================")

    ts = int(time.time())

    # 1. Verify Frontend Pages (Next.js SSR/Static)
    print("\n1. Verifying Next.js Frontend Routes...")
    routes = ["/", "/login", "/signup", "/wishlist", "/bookings", "/host", "/host/create", "/host/bookings"]
    for r in routes:
        status, body = make_req(f"{FRONTEND_URL}{r}")
        assert status == 200, f"Route {r} failed with status {status}"
        print(f"  [PASS] {FRONTEND_URL}{r} -> HTTP 200 OK")

    # 2. Test Scenario Section 28: User 1 (Rahul) Signup as Normal Guest (is_host = False)
    print("\n2. Verifying Guest Signup (Rahul starts with is_host = False)...")
    rahul_email = f"rahul_{ts}@example.com"
    status, rahul_signup = make_req(f"{BACKEND_URL}/auth/signup", method="POST", data={
        "name": "Rahul Verma",
        "email": rahul_email,
        "password": "password123",
        "confirm_password": "password123",
        "phone": "+91 9811223344"
    })
    assert status == 200, f"Signup failed: {rahul_signup}"
    rahul_token = rahul_signup["access_token"]
    rahul_headers = {"Authorization": f"Bearer {rahul_token}"}
    assert rahul_signup["user"]["is_host"] is False, "New user must start with is_host = False"
    print(f"  [PASS] Rahul signed up -> is_host: {rahul_signup['user']['is_host']} (Guest role)")

    # Verify /auth/me returns is_host = False
    status, rahul_me = make_req(f"{BACKEND_URL}/auth/me", headers=rahul_headers)
    assert status == 200 and rahul_me["is_host"] is False
    print(f"  [PASS] Rahul /auth/me profile verified -> is_host: {rahul_me['is_host']}")

    # 3. Rahul Becomes a Host by creating his first listing (Goa Villa)
    print("\n3. Verifying 'Become a Host' Flow (is_host transitions to True on listing creation)...")
    status, rahul_create = make_req(f"{BACKEND_URL}/listings", method="POST", headers=rahul_headers, data={
        "house_name": "Rahul's Luxury Sunset Villa",
        "street": "Calangute Beach Road",
        "location": "Goa",
        "state": "Goa",
        "description": "Private infinity pool villa steps from the Arabian Sea.",
        "price_per_night": 7500.0,
        "maximum_guests": 6,
        "property_type": "House",
        "bathroom_type": "Attached",
        "images": [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"
        ],
        "amenities": ["WiFi", "AC", "Kitchen", "Free Parking"],
        "uniqueness": ["Luxury", "Scenic View"]
    })
    assert status == 201, f"Listing creation failed: {rahul_create}"
    goa_villa_id = rahul_create["id"]
    print(f"  [PASS] Rahul published listing -> ID {goa_villa_id}")

    # Verify Rahul is now permanently a host
    status, rahul_me_after = make_req(f"{BACKEND_URL}/auth/me", headers=rahul_headers)
    assert status == 200 and rahul_me_after["is_host"] is True, "User must now have is_host = True"
    print(f"  [PASS] Rahul /auth/me role elevated -> is_host: {rahul_me_after['is_host']}")

    # 4. Rahul (as a Guest) books another property (House 2: South Delhi Designer Studio)
    print("\n4. Verifying Rahul can act as a Guest (Books Delhi Apartment)...")
    status, rahul_trip = make_req(f"{BACKEND_URL}/bookings", method="POST", headers=rahul_headers, data={
        "listing_id": 2,
        "start_date": "2026-12-01",
        "end_date": "2026-12-05",
        "guests": 2
    })
    assert status == 201, f"Guest booking failed: {rahul_trip}"
    rahul_trip_id = rahul_trip["id"]
    print(f"  [PASS] Rahul booked Delhi Apartment -> Booking ID {rahul_trip_id}")

    # Check Rahul's "My Trips" (/bookings/my)
    status, rahul_trips_list = make_req(f"{BACKEND_URL}/bookings/my", headers=rahul_headers)
    assert status == 200 and any(t["id"] == rahul_trip_id for t in rahul_trips_list)
    print(f"  [PASS] Rahul's My Trips contains Delhi Apartment booking (Total trips: {len(rahul_trips_list)})")

    # 5. User 2 (Amit) Signs Up and Books Rahul's Goa Villa
    print("\n5. Verifying Amit (Guest) books Rahul's Goa Villa...")
    amit_email = f"amit_{ts}@example.com"
    status, amit_signup = make_req(f"{BACKEND_URL}/auth/signup", method="POST", data={
        "name": "Amit Sharma",
        "email": amit_email,
        "password": "password123",
        "confirm_password": "password123",
        "phone": "+91 9778899001"
    })
    assert status == 200 and amit_signup["user"]["is_host"] is False
    amit_token = amit_signup["access_token"]
    amit_headers = {"Authorization": f"Bearer {amit_token}"}
    print(f"  [PASS] Amit signed up -> Guest role")

    # Amit books Rahul's Goa Villa for 2026-08-20 to 2026-08-24
    status, amit_booking = make_req(f"{BACKEND_URL}/bookings", method="POST", headers=amit_headers, data={
        "listing_id": goa_villa_id,
        "start_date": "2026-08-20",
        "end_date": "2026-08-24",
        "guests": 2
    })
    assert status == 201, f"Amit booking failed: {amit_booking}"
    amit_booking_id = amit_booking["id"]
    print(f"  [PASS] Amit booked Rahul's Goa Villa -> Booking ID {amit_booking_id}")

    # 6. Verify Isolation: Host Bookings vs My Trips
    print("\n6. Verifying Host Bookings vs My Trips Separation...")
    # Rahul checks Host Bookings
    status, rahul_host_bookings = make_req(f"{BACKEND_URL}/host/bookings", headers=rahul_headers)
    assert status == 200
    matching_host_b = [b for b in rahul_host_bookings if b["id"] == amit_booking_id]
    assert len(matching_host_b) == 1, "Amit's booking must appear in Rahul's Host Bookings"
    assert matching_host_b[0]["guest_name"] == "Amit Sharma"
    print(f"  [PASS] Rahul's Host Bookings shows Guest: Amit Sharma on Goa Villa (Total: INR {matching_host_b[0]['total_price']})")

    # Rahul checks My Trips - must NOT contain Amit's booking
    status, rahul_my_trips = make_req(f"{BACKEND_URL}/bookings/my", headers=rahul_headers)
    assert not any(t["id"] == amit_booking_id for t in rahul_my_trips), "Amit's booking must NOT appear in Rahul's My Trips!"
    print(f"  [PASS] Rahul's My Trips is strictly isolated (only shows trips booked by Rahul)")

    # 7. Safe Deletion / Unlist Logic: Rahul cannot permanently delete property with active bookings
    print("\n7. Verifying Safe Deletion / Unlist Logic for property with active reservations...")
    status, del_attempt = make_req(f"{BACKEND_URL}/listings/{goa_villa_id}", method="DELETE", headers=rahul_headers)
    assert status == 400, f"Expected 400 Bad Request when deleting property with active bookings, got {status}"
    print(f"  [PASS] Permanent deletion blocked with 400: '{del_attempt.get('detail', '')}'")

    # Rahul unlists Goa Villa
    status, unlist_res = make_req(f"{BACKEND_URL}/listings/{goa_villa_id}/unlist", method="PUT", headers=rahul_headers)
    assert status == 200 and unlist_res["is_active"] is False
    print(f"  [PASS] Rahul unlisted Goa Villa successfully")

    # Verify unlisted property no longer appears in public search / listings
    status, public_listings = make_req(f"{BACKEND_URL}/listings")
    assert not any(l["id"] == goa_villa_id for l in public_listings), "Unlisted property must NOT appear in public listings"
    print(f"  [PASS] Unlisted Goa Villa disappeared from public search")

    # Verify Amit's My Trips remains confirmed and intact
    status, amit_trips = make_req(f"{BACKEND_URL}/bookings/my", headers=amit_headers)
    assert any(t["id"] == amit_booking_id and t["status"] == "confirmed" for t in amit_trips)
    print(f"  [PASS] Amit's My Trips remains Confirmed and intact after unlisting")

    # Verify Rahul's Host Bookings remains intact with unlisted status
    status, rahul_host_bookings_2 = make_req(f"{BACKEND_URL}/host/bookings", headers=rahul_headers)
    assert any(b["id"] == amit_booking_id and b["is_active"] is False for b in rahul_host_bookings_2)
    print(f"  [PASS] Rahul's Host Bookings preserves reservation with is_active: False")

    # Verify Rahul remains permanently a host
    status, rahul_final_me = make_req(f"{BACKEND_URL}/auth/me", headers=rahul_headers)
    assert rahul_final_me["is_host"] is True, "Host status must remain True permanently"
    print(f"  [PASS] Rahul remains permanently a host -> is_host: {rahul_final_me['is_host']}")

    print("\n===================================================================")
    print("  ALL GUEST & HOST ROLE WORKFLOW TESTS PASSED WITH 100% SUCCESS!   ")
    print("===================================================================")

if __name__ == "__main__":
    run_e2e()
