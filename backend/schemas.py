from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional

# --- User Schemas ---
class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    phone: Optional[str] = None

    @field_validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values.data and v != values.data['password']:
            raise ValueError('Passwords do not match')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    is_host: bool = False
    created_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Review Schemas ---
class ReviewCreate(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: str = Field(..., min_length=2, max_length=2000)

class ReviewOut(BaseModel):
    id: int
    listing_id: int
    user_id: int
    user_name: str
    rating: float
    comment: str
    created_at: str

# --- Listing Schemas ---
class ListingImageOut(BaseModel):
    id: int
    image_url: str
    image_order: int

PROPERTY_TYPE_PATTERN = "^(House|Apartment|Villa|Hotel|Cottage|Cabin|Guesthouse|Resort)$"
PLACE_TYPE_PATTERN = "^(Entire place|Private room|Hotel room|Shared room)$"

class ListingCreate(BaseModel):
    house_name: str = Field(..., min_length=3, max_length=200)
    street: str = Field(..., min_length=2)
    location: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    price_per_night: float = Field(..., gt=0)
    maximum_guests: int = Field(..., ge=1, le=50)
    bedrooms: int = Field(default=1, ge=1)
    beds: int = Field(default=1, ge=1)
    property_type: str = Field(..., pattern=PROPERTY_TYPE_PATTERN)
    place_type: str = Field(default="Entire place", pattern=PLACE_TYPE_PATTERN)
    bathroom_type: str = Field(..., pattern="^(Attached|Not Attached)$")
    phone: Optional[str] = None
    images: List[str] = Field(..., min_length=3, max_length=3)
    amenities: List[str] = Field(default_factory=list)
    uniqueness: List[str] = Field(default_factory=list)

class ListingUpdate(BaseModel):
    house_name: Optional[str] = Field(None, min_length=3, max_length=200)
    street: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    description: Optional[str] = None
    price_per_night: Optional[float] = Field(None, gt=0)
    maximum_guests: Optional[int] = Field(None, ge=1, le=50)
    bedrooms: Optional[int] = Field(None, ge=1)
    beds: Optional[int] = Field(None, ge=1)
    property_type: Optional[str] = Field(None, pattern=PROPERTY_TYPE_PATTERN)
    place_type: Optional[str] = Field(None, pattern=PLACE_TYPE_PATTERN)
    bathroom_type: Optional[str] = Field(None, pattern="^(Attached|Not Attached)$")
    phone: Optional[str] = None
    images: Optional[List[str]] = Field(None, min_length=3, max_length=3)
    amenities: Optional[List[str]] = None
    uniqueness: Optional[List[str]] = None

class HostInfo(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None

class BookedDateRange(BaseModel):
    start_date: str
    end_date: str

class ListingSummaryOut(BaseModel):
    id: int
    host_id: int
    house_name: str
    street: str
    location: str
    state: str
    price_per_night: float
    maximum_guests: int
    bedrooms: int = 1
    beds: int = 1
    property_type: str
    place_type: str = "Entire place"
    bathroom_type: str
    image_url: str  # First image
    rating: Optional[float] = None
    review_count: int = 0
    is_favourite: bool = False
    is_active: bool = True

class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int

class PaginatedListingsOut(BaseModel):
    listings: List[ListingSummaryOut]
    pagination: PaginationMeta
    page: int
    limit: int
    total: int
    total_pages: int

class ListingDetailOut(BaseModel):
    id: int
    host_id: int
    host: HostInfo
    house_name: str
    street: str
    location: str
    state: str
    description: str
    price_per_night: float
    maximum_guests: int
    bedrooms: int = 1
    beds: int = 1
    property_type: str
    place_type: str = "Entire place"
    bathroom_type: str
    images: List[str]
    amenities: List[str]
    uniqueness: List[str]
    rating: Optional[float] = None
    review_count: int = 0
    is_favourite: bool = False
    is_active: bool = True
    booked_dates: List[BookedDateRange] = []
    reviews: List[ReviewOut] = []
    created_at: Optional[str] = None

# --- Booking Schemas ---
class BookingCreate(BaseModel):
    listing_id: int
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    guests: int = Field(..., ge=1)
    guest_message: Optional[str] = Field(None, max_length=500)

class BookingOut(BaseModel):
    id: int
    listing_id: int
    user_id: int
    house_name: str
    location: str
    state: str
    image_url: str
    start_date: str
    end_date: str
    guests: int
    nights: Optional[int] = None
    price_per_night: Optional[float] = None
    base_price: Optional[float] = None
    additional_charges: Optional[float] = None
    discount: Optional[float] = None
    total_price: float
    guest_message: Optional[str] = None
    status: str
    created_at: str
    host_name: Optional[str] = None
    host_phone: Optional[str] = None

class HostBookingOut(BaseModel):
    id: int
    listing_id: int
    house_name: str
    location: str
    state: str
    image_url: str
    guest_id: int
    guest_name: str
    guest_email: str
    guest_phone: Optional[str] = None
    start_date: str
    end_date: str
    guests: int
    nights: Optional[int] = None
    price_per_night: Optional[float] = None
    base_price: Optional[float] = None
    additional_charges: Optional[float] = None
    discount: Optional[float] = None
    total_price: float
    guest_message: Optional[str] = None
    status: str
    is_active: bool = True
    created_at: str

# --- Favorite Schemas ---
class FavoriteOut(BaseModel):
    id: int
    listing_id: int
    listing: ListingSummaryOut
    created_at: str
