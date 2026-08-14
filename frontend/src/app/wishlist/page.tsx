'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Star, MapPin, Trash2, ArrowRight } from 'lucide-react';
import { FavoriteItem } from '@/types';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function WishlistContent() {
  const router = useRouter();
  const { success, error } = useToast();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<FavoriteItem[]>('/favorites');
      setFavorites(data);
    } catch {
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (listingId: number) => {
    try {
      await apiRequest(`/favorites/${listingId}`, { method: 'DELETE' });
      setFavorites((prev) => prev.filter((item) => item.listing_id !== listingId));
      success('Removed from Wishlist.');
    } catch (err: any) {
      error(err.message || 'Failed to remove from wishlist.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Wishlist</h1>
        <p className="text-sm text-gray-500 mt-1">
          {favorites.length} {favorites.length === 1 ? 'saved home' : 'saved homes'}
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-square bg-gray-200 rounded-2xl w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map(({ id, listing_id, listing }) => (
            <div
              key={id}
              className="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image with Direct Click */}
              <div
                onClick={() => router.push(`/listing/${listing_id}`)}
                className="relative aspect-square w-full overflow-hidden bg-gray-100 cursor-pointer"
              >
                <img
                  src={listing.image_url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'}
                  alt={listing.house_name}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-full text-[#FF385C] shadow-md">
                  <Heart className="w-5 h-5 fill-[#FF385C]" />
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div
                  onClick={() => router.push(`/listing/${listing_id}`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-base truncate">
                      {listing.house_name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-900 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{listing.rating ? listing.rating.toFixed(1) : 'New'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{listing.location}, {listing.state}</span>
                  </p>
                  <div className="mt-2 text-sm text-gray-900 font-bold">
                    &#8377;{listing.price_per_night.toLocaleString()}{' '}
                    <span className="text-gray-500 font-normal text-xs">/ night</span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveFavorite(listing_id)}
                  className="w-full py-2 px-3 rounded-xl border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-xs font-semibold text-rose-600 flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove from Favourite</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-gray-50 rounded-3xl border border-gray-200 p-8">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center">
            <Heart className="w-8 h-8 fill-rose-100" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Your Wishlist is empty</h3>
          <p className="text-gray-500 max-w-sm text-sm">
            Explore homes and save your favourites by clicking the heart icon on any property.
          </p>
          <Link
            href="/"
            className="mt-2 px-6 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white text-sm font-semibold rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Explore Homes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <WishlistContent />
    </ProtectedRoute>
  );
}
