import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import (
    auth_routes,
    listing_routes,
    booking_routes,
    favorite_routes,
    review_routes,
    host_routes
)

# Initialize database schema on startup
init_db()

app = FastAPI(
    title="Airbnb Clone API",
    description="Full-Stack Airbnb Clone Backend with SQLite, Auth, Search, Bookings, Host CRUD, Reviews and Favourites",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
def root():
    return {
        "status": "healthy",
        "message": "Airbnb Clone API is running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
