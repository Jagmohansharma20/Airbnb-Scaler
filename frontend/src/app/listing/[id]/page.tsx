'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Star, 
  MapPin, 
  Heart, 
  Share2, 
  Wifi, 
  Tv, 
  Car, 
  Snowflake, 
  Utensils, 
  Dumbbell, 
  Shirt, 
  Refrigerator,
  Sparkles, 
  Home, 
  Bed,
  Bath, 
  Users, 
  Mail, 
  Phone, 
  UserCircle2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ListingDetail } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { BookingCard } from '@/components/BookingCard';
import { ReviewSection } from '@/components/ReviewSection';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const AMENITY_ICONS: Record<string, any> = {
  WiFi: Wifi,
  TV: Tv,
  'Free Parking': Car,
  AC: Snowflake,
  Kitchen: Utensils,
  Gym: Dumbbell,
  'Washing Machine': Shirt,
  Fridge: Refrigerator,
};

function ListingDetailsContent({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isUpdatingFav, setIsUpdatingFav] = useState<boolean>(false);

  useEffect(() => {
    async function fetchListing() {
      setIsLoading(true);
      try {
        const data = await apiRequest<ListingDetail>(`/listings/${id}`);
        setListing(data);
        setIsFavorite(Boolean(data.is_favourite));
      } catch (err: any) {
        error(err.message || 'Could not load listing details.');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
    fetchListing();
  }, [id, router, error]);

  const handleFavoriteToggle = async () => {
    if (!listing) return;
    if (isUpdatingFav) return;

    setIsUpdatingFav(true);
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      if (nextState) {
        await apiRequest(`/favorites/${listing.id}`, { method: 'POST' });
        success('Added to your Wishlist!');
      } else {
        await apiRequest(`/favorites/${listing.id}`, { method: 'DELETE' });
        success('Removed from your Wishlist.');
      }
    } catch {
      setIsFavorite(!nextState);
      error('Failed to update wishlist.');
    } finally {
      setIsUpdatingFav(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      success('Listing URL copied to clipboard!');
    }
  };

  if (isLoading || !listing) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#FF385C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm">Loading home details...</p>
      </div>
    );
  }

  const images = listing.images && listing.images.length >= 3 
    ? listing.images 
    : [
        listing.images[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'
      ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* 1. Header: Title & Action buttons */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {listing.house_name}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 font-semibold text-gray-900">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{listing.rating ? listing.rating.toFixed(1) : 'New'}</span>
              {listing.review_count > 0 && (
                <span className="text-gray-500 font-normal">
                  ({listing.review_count} {listing.review_count === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
            <span>&middot;</span>
            <div className="flex items-center gap-1 font-medium underline text-gray-800">
              <MapPin className="w-4 h-4 text-[#FF385C]" />
              <span>{listing.street}, {listing.location}, {listing.state}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 font-semibold text-gray-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="underline">Share</span>
            </button>
            <button
              onClick={handleFavoriteToggle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 font-semibold text-gray-700 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-[#FF385C] text-[#FF385C]' : 'text-gray-700'
                }`}
              />
              <span className="underline">{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Photo Gallery: Section 14 (3 images: Big left image, 2 stacked right images) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[320px] sm:h-[420px] md:h-[460px] rounded-3xl overflow-hidden shadow-sm">
        {/* Main Image 1 (Left 2 columns on desktop) */}
        <div className="md:col-span-2 relative h-full overflow-hidden bg-gray-100 group">
          <img
            src={images[0]}
            alt={`${listing.house_name} - Primary Photo`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Stacked Images 2 & 3 (Right column on desktop) */}
        <div className="hidden md:grid grid-rows-2 gap-3 h-full">
          <div className="relative overflow-hidden bg-gray-100 group">
            <img
              src={images[1]}
              alt={`${listing.house_name} - Second Photo`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative overflow-hidden bg-gray-100 group">
            <img
              src={images[2]}
              alt={`${listing.house_name} - Third Photo`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      {/* 3. Main Content: Info & Sticky Booking Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        
        {/* Left 2 Cols: Details & Amenities */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Host Info Box */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {listing.place_type || 'Entire place'} in {listing.property_type} hosted by {listing.host.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center flex-wrap gap-2 sm:gap-3">
                <span className="font-medium text-gray-800">
                  {listing.maximum_guests} {listing.maximum_guests === 1 ? 'guest' : 'guests'}
                </span>
                <span>&middot;</span>
                <span className="font-medium text-gray-800">
                  {listing.bedrooms || 1} {listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
                </span>
                <span>&middot;</span>
                <span className="font-medium text-gray-800">
                  {listing.beds || 1} {listing.beds === 1 ? 'bed' : 'beds'}
                </span>
                <span>&middot;</span>
                <span className="font-medium text-gray-800">
                  {listing.bathroom_type} bath
                </span>
              </p>
              
              <div className="flex items-center flex-wrap gap-3 mt-3 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 font-semibold text-gray-700">
                  <Home className="w-3.5 h-3.5 text-[#FF385C]" />
                  {listing.property_type}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 font-semibold text-gray-700">
                  <Bed className="w-3.5 h-3.5 text-[#FF385C]" />
                  {listing.place_type || 'Entire place'}
                </span>
              </div>
            </div>

            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF385C] to-rose-400 text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
              {listing.host.name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Host Contact Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Host Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-[#FF385C]" />
                <span className="font-medium text-gray-900">{listing.host.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-[#FF385C]" />
                <span className="font-medium text-gray-900">{listing.host.phone || '+91 9876543210'}</span>
              </div>
            </div>
          </div>

          {/* Uniqueness Badges (Section 20) */}
          {listing.uniqueness && listing.uniqueness.length > 0 && (
            <div className="space-y-3 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                What Makes This Property Unique
              </h3>
              <div className="flex flex-wrap gap-2">
                {listing.uniqueness.map((feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-[#FF385C] border border-rose-200/60 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">About this place</h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Amenities Grid (Section 18) */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">What this place offers</h3>
            <div className="grid grid-cols-2 gap-4">
              {listing.amenities.map((amenity) => {
                const IconComponent = AMENITY_ICONS[amenity] || CheckCircle2;
                return (
                  <div key={amenity} className="flex items-center gap-3 text-gray-800 text-sm">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews Section */}
          <ReviewSection
            listingId={listing.id}
            initialReviews={listing.reviews || []}
            avgRating={listing.rating}
            reviewCount={listing.review_count}
          />
        </div>

        {/* Right Col: Sticky Booking Card */}
        <div>
          <BookingCard listing={listing} />
        </div>

      </div>
    </div>
  );
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ProtectedRoute>
      <ListingDetailsContent id={resolvedParams.id} />
    </ProtectedRoute>
  );
}
