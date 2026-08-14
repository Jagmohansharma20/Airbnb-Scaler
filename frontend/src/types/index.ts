export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_host?: boolean;
  created_at?: string;
}

export interface HostInfo {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}

export interface BookedDateRange {
  start_date: string;
  end_date: string;
}

export interface Review {
  id: number;
  listing_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ListingSummary {
  id: number;
  host_id: number;
  house_name: string;
  street: string;
  location: string;
  state: string;
  price_per_night: number;
  maximum_guests: number;
  bedrooms?: number;
  beds?: number;
  property_type: string;
  place_type: string;
  bathroom_type: string;
  image_url: string;
  rating: number | null;
  review_count: number;
  is_favourite?: boolean;
  is_active?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedListingsResponse {
  listings: ListingSummary[];
  pagination: PaginationMeta;
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ListingDetail {
  id: number;
  host_id: number;
  host: HostInfo;
  house_name: string;
  street: string;
  location: string;
  state: string;
  description: string;
  price_per_night: number;
  maximum_guests: number;
  bedrooms: number;
  beds: number;
  property_type: string;
  place_type: string;
  bathroom_type: string;
  images: string[];
  amenities: string[];
  uniqueness: string[];
  rating: number | null;
  review_count: number;
  is_favourite: boolean;
  is_active?: boolean;
  booked_dates: BookedDateRange[];
  reviews: Review[];
  created_at?: string;
}

export interface Booking {
  id: number;
  listing_id: number;
  user_id: number;
  house_name: string;
  location: string;
  state: string;
  image_url: string;
  start_date: string;
  end_date: string;
  guests: number;
  nights?: number;
  price_per_night?: number;
  base_price?: number;
  additional_charges?: number;
  discount?: number;
  total_price: number;
  guest_message?: string | null;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  host_name?: string;
  host_phone?: string;
}

export interface HostBooking {
  id: number;
  listing_id: number;
  guest_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  house_name: string;
  location: string;
  state: string;
  image_url: string;
  start_date: string;
  end_date: string;
  guests: number;
  nights?: number;
  price_per_night?: number;
  base_price?: number;
  additional_charges?: number;
  discount?: number;
  total_price: number;
  guest_message?: string | null;
  status: 'confirmed' | 'cancelled';
  is_active: boolean;
  created_at: string;
}

export interface FavoriteItem {
  id: number;
  listing_id: number;
  listing: ListingSummary;
  created_at: string;
}
