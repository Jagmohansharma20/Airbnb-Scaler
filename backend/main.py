import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db

# Initialize database schema on startup
init_db()

# Auto-seed if database is fresh with 0 listings
try:
    from database import get_db_connection
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as count FROM listings;")
    row = c.fetchone()
    listing_count = row["count"] if row else 0
    conn.close()
    if listing_count == 0:
        from seed import seed_database
        print("Empty database detected on startup. Auto-seeding initial listings...")
        seed_database()
except Exception as e:
    print(f"Startup database check/seed notice: {e}")

from routers import (
    auth_routes,
    listing_routes,
    booking_routes,
    favorite_routes,
    review_routes,
    host_routes
)

app = FastAPI(
    title="Airbnb Clone API",
    description="Full-Stack Airbnb Clone Backend with SQLite, Auth, Search, Bookings, Host CRUD, Reviews and Favourites",
    version="1.0.0"
)

# Configure CORS for Vercel (Production) & Localhost (Development)
origins = [
    "https://airbnb-scaler.vercel.app",
    "https://airbnb-scaler.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth_routes.router)
app.include_router(listing_routes.router)
app.include_router(booking_routes.router)
app.include_router(favorite_routes.router)
app.include_router(review_routes.router)
app.include_router(host_routes.router)

@app.get("/")
@app.get("/health")
def root():
    return {
        "status": "healthy",
        "message": "Airbnb Clone API is running",
        "version": "1.0.0",
        "frontend_url": "https://airbnb-scaler.vercel.app",
        "backend_url": "https://airbnb-scaler.onrender.com"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)

