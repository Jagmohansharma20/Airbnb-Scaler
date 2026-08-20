# Airbnb Clone — Full-Stack Web Application

A modern, production-grade Airbnb clone full-stack web application built with **Next.js (App Router, TypeScript, Tailwind CSS)** on the frontend and **FastAPI with SQLite** on the backend.

---

## Features & Capabilities

- **Home Page & Search**:
  - Floating Airbnb-style search bar (`Where`, `When`, `Who`, `Search`).
  - Partial location search matching (e.g. "Delhi" matches "Delhi", "New Delhi", "South Delhi").
  - Guest capacity filtering (`maximum_guests >= requested_guests`).
  - **Backend Date-Overlap Booking Availability**: Automatically excludes houses with overlapping confirmed reservations. Same-day checkout/check-in is allowed.
  - Category pill carousel (Villas, Beachfront, Cabins, Iconic cities, Mountains, Luxe).
  - Listing cards featuring the first image, heart toggle for Wishlist, rating (★ 4.8 / New), and price per night in INR (`₹4,500 night`).

- **Strict Authentication Rule (Section 2)**:
  - Logged-out users can only browse the Home page and use Search.
  - Clicking any listing card or protected route (`/listing/[id]`, `/wishlist`, `/bookings`, `/host`, `/host/create`, `/host/edit/[id]`) directly redirects to `/login?redirect=...`.
  - Passwords hashed using PBKDF2-SHA256 with random salt.
  - JWT Bearer token authentication.

- **House Details Page (`/listing/[id]`)**:
  - **3-Image Photo Grid**: Hero image on left, 2 stacked images on right.
  - Host contact information (Name, Email, Phone).
  - Property type, bathroom type, maximum guests, full description.
  - Amenities grid with icons (WiFi, TV, AC, Kitchen, Free Parking, Washing Machine, Gym, Fridge).
  - Uniqueness badges (Peaceful, Scenic View, Luxury, Cozy, etc.).
  - **Sticky Booking Card**:
    - Interactive check-in & check-out date picker disabling booked dates.
    - Guest count selector.
    - Dynamic price breakdown (`nights * price` + `₹1,500 service fee` = `Total`).
    - **Mock Payment Modal**: Animated payment processing and confirmation.
  - **Review System**: Average rating calculation from reviews, review list, and interactive "Leave a Review" form with star selector (1-5) and comments.

- **Wishlist Page (`/wishlist`)**:
  - View all favourited houses.
  - Remove from Wishlist with instant UI update and database synchronization.
  - Empty state with CTA to explore homes.

- **Bookings Management (`/bookings`)**:
  - View all user bookings with house image, name, location, date range, guests, total price, and status badge (`Confirmed` / `Cancelled`).
  - **Cancel Booking**: Updates status to `cancelled`, preserves booking history in the database, and immediately releases the reservation dates for other users.

- **Become a Host & Hosting Dashboard (`/host`, `/host/create`, `/host/edit/[id]`)**:
  - Pre-filled host name and email from account, editable phone.
  - Form for property details, property type dropdown, bathroom type radio, amenities checkboxes, uniqueness badges, and **exactly 3 image URL inputs** with live thumbnail previews.
  - Host Dashboard displaying all properties hosted by the current user.
  - Edit hosting pre-filled with existing data.
  - Permanent delete confirmation modal. Ownership verified on the backend.

- **Toast Notifications**:
  - Integrated feedback for Signup, Login, Logout, Added/Removed Wishlist, Booking confirmed/cancelled, Hosting created/updated/deleted, and Reviews.

---

## Project Structure

```
airbnb/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint with CORS
│   ├── database.py              # SQLite connection & schema initialization
│   ├── auth.py                  # PBKDF2 password hashing & JWT token dependencies
│   ├── schemas.py               # Pydantic request/response validation schemas
│   ├── seed.py                  # Realistic seed data (10 properties, 5 users, reviews, bookings)
│   ├── test_api.py              # Backend API test suite
│   ├── test_e2e_full_flow.py    # Complete E2E integration test suite
│   ├── requirements.txt         # Python dependencies
│   └── routers/
│       ├── auth_routes.py       # /auth/signup, /auth/login, /auth/me, /auth/logout
│       ├── listing_routes.py    # /listings, /listings/{id}, search & CRUD
│       ├── booking_routes.py    # /bookings, /bookings/my, /bookings/{id}/cancel
│       ├── favorite_routes.py   # /favorites, /favorites/{listing_id}
│       ├── review_routes.py     # /listings/{id}/reviews
│       └── host_routes.py       # /host/listings, /host/bookings
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout with ToastProvider, AuthProvider, Navbar, Footer
│   │   │   ├── page.tsx               # Home Page with search & listing grid
│   │   │   ├── login/page.tsx         # Login Page
│   │   │   ├── signup/page.tsx        # Signup Page
│   │   │   ├── listing/[id]/page.tsx  # Listing Details (3 images, booking card, reviews)
│   │   │   ├── wishlist/page.tsx      # Wishlist Page
│   │   │   ├── bookings/page.tsx      # User Bookings Page
│   │   │   ├── host/page.tsx          # Host Dashboard
│   │   │   ├── host/create/page.tsx   # Create Hosting Form (3 images, amenities)
│   │   │   └── host/edit/[id]/page.tsx# Edit Hosting Form
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Navbar with user menu dropdown & auth states
│   │   │   ├── Footer.tsx             # Airbnb footer
│   │   │   ├── SearchBar.tsx          # Where/When/Who search bar
│   │   │   ├── ListingCard.tsx        # Listing card with heart favourite toggle
│   │   │   ├── BookingCard.tsx        # Sticky booking card with date validation & pricing
│   │   │   ├── MockPaymentModal.tsx   # Animated mock payment modal
│   │   │   ├── ReviewSection.tsx      # Reviews list & review submission form
│   │   │   ├── DeleteModal.tsx        # Permanent deletion confirmation dialog
│   │   │   └── ProtectedRoute.tsx     # Route guard redirecting to /login
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Session management, login, signup, logout
│   │   │   └── ToastContext.tsx       # Global toast notification triggers
│   │   ├── lib/
│   │   │   └── api.ts                 # Fetch client with Bearer token injection
│   │   └── types/
│   │       └── index.ts               # TypeScript interfaces
└── README.md
```

---

## Quick Start Instructions

### 1. Start Backend (FastAPI)
```bash
cd backend
python seed.py
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The API will be available at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).

### 2. Start Frontend (Next.js)
```bash
cd frontend
npm run dev -- -p 3000
```
The web application will be available at `http://localhost:3000`.

### 3. Run Automated E2E Tests
```bash
cd backend
python test_e2e_full_flow.py
```

---
