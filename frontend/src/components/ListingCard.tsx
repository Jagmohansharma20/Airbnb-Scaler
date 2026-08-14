'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Star, MapPin } from 'lucide-react';
import { ListingSummary } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiRequest } from '@/lib/api';

interface ListingCardProps {
  listing: ListingSummary;
  onFavoriteChange?: (listingId: number, isFav: boolean) => void;
}

export function ListingCard({ listing, onFavoriteChange }: ListingCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [isFavorite, setIsFavorite] = useState<boolean>(Boolean(listing.is_favourite));
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleCardClick = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`);
      return;
    }
    router.push(`/listing/${listing.id}`);
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card navigation

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/')}`);
      return;
    }

    if (isUpdating) return;
    setIsUpdating(true);

    const nextState = !isFavorite;
    setIsFavorite(nextState); // optimistic update

    try {
      if (nextState) {
        await apiRequest(`/favorites/${listing.id}`, { method: 'POST' });
        success('Added to your Wishlist!');
      } else {
        await apiRequest(`/favorites/${listing.id}`, { method: 'DELETE' });
        success('Removed from your Wishlist.');
      }
      if (onFavoriteChange) {
        onFavoriteChange(listing.id, nextState);
      }
    } catch (err: any) {
      setIsFavorite(!nextState); // revert on error
      error('Failed to update wishlist. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer flex flex-col transition-transform duration-200 hover:-translate-y-1 select-none"
    >
      {/* Image Container with Heart Button */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 mb-3 shadow-sm group-hover:shadow-md transition-shadow">
        <img
          src={listing.image_url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'}
          alt={listing.house_name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteToggle}
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 p-2 rounded-full hover:scale-110 active:scale-90 transition-transform duration-150 z-10 drop-shadow-md"
        >
          <Heart
            className={`w-6 h-6 transition-colors duration-200 ${
              isFavorite
                ? 'fill-[#FF385C] text-[#FF385C]'
                : 'text-white fill-black/30 stroke-white stroke-2 hover:fill-black/50'
            }`}
          />
        </button>

        {/* Property Type & Place Type Badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-gray-800 shadow-sm">
          {listing.property_type}{listing.place_type ? ` · ${listing.place_type}` : ''}
        </div>
      </div>

      {/* House Details */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate leading-snug">
            {listing.house_name}
          </h3>
          <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{listing.location}, {listing.state}</span>
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 shrink-0">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{listing.rating ? listing.rating.toFixed(1) : 'New'}</span>
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-2 text-sm text-gray-900">
        <span className="font-bold text-base">&#8377;{listing.price_per_night.toLocaleString()}</span>
        <span className="text-gray-600 font-normal"> / night</span>
      </div>
    </div>
  );
}
