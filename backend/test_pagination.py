import sqlite3
import urllib.parse
from fastapi.testclient import TestClient
from main import app
from seed import seed_database

client = TestClient(app)

def test_pagination_suite():
    print("\n=======================================================")
    print("  AIRBNB PAGINATION SUITE: 10 LISTINGS PER PAGE (LIMIT/OFFSET)")
    print("=======================================================")

    seed_database()

    # 1. Page 1 of 2 (Default limit=20, Unfiltered)
    res = client.get("/listings?page=1")
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 1
    assert data["limit"] == 20
    assert data["total"] == 25
    assert data["total_pages"] == 2
    assert len(data["listings"]) == 20
    page1_ids = [l["id"] for l in data["listings"]]
    print(f"[PASS] Page 1: 20 listings returned, Total: {data['total']}, Total Pages: {data['total_pages']}")

    # 2. Page 2 of 2 (Default limit=20, Unfiltered)
    res = client.get("/listings?page=2")
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 2
    assert data["limit"] == 20
    assert len(data["listings"]) == 5
    page2_ids = [l["id"] for l in data["listings"]]
    assert len(set(page1_ids).intersection(set(page2_ids))) == 0, "Page 1 and Page 2 must not overlap!"
    print(f"[PASS] Page 2: 5 remaining listings returned with zero overlap from Page 1 (20 + 5 = 25 total)")

    # 4. Search Location with Pagination (Filter applied before pagination)
    res = client.get("/listings?location=goa&page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 4
    assert data["total_pages"] == 1
    assert len(data["listings"]) == 4
    assert all("goa" in l["location"].lower() for l in data["listings"])
    print(f"[PASS] Location filter 'Goa' filtered before pagination: 4 listings, total_pages=1")

    # 5. Category filter with Pagination
    res = client.get("/listings?property_type=Apartment&page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 6
    assert data["total_pages"] == 1
    assert len(data["listings"]) == 6
    assert all(l["property_type"] == "Apartment" for l in data["listings"])
    print(f"[PASS] Category filter 'Apartment' returned exactly 6 apartments")

    # 6. Combined Filters with Pagination
    res = client.get("/listings?min_price=4000&max_price=8000&page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert all(4000 <= l["price_per_night"] <= 8000 for l in data["listings"])
    print(f"[PASS] Price filter (4000-8000) returned {data['total']} listings, total_pages={data['total_pages']}")

    # 7. No Results / Empty State
    res = client.get("/listings?location=NonExistentCityXYZ&page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert data["total_pages"] == 0
    assert len(data["listings"]) == 0
    print("[PASS] Zero matching results returns total=0, total_pages=0, listings=[]")

    print("\n=======================================================")
    print("  ALL PAGINATION SUITE TESTS PASSED 100%!              ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_pagination_suite()
