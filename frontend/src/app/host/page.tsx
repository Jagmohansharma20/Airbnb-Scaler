'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Home, 
  Star, 
  MapPin, 
  Eye, 
  CalendarCheck2, 
  AlertTriangle,
  EyeOff,
  LayoutDashboard
} from 'lucide-react';
import { ListingSummary } from '@/types';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DeleteModal } from '@/components/DeleteModal';

function HostDashboardContent() {
  const router = useRouter();
  const { success, error } = useToast();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingListing, setDeletingListing] = useState<ListingSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [unlistPromptListing, setUnlistPromptListing] = useState<ListingSummary | null>(null);
  const [isUnlisting, setIsUnlisting] = useState<boolean>(false);

  const fetchHostListings = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<ListingSummary[]>('/host/listings');
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHostListings();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingListing) return;
    setIsDeleting(true);

    try {
      await apiRequest(`/listings/${deletingListing.id}`, { method: 'DELETE' });
      setListings((prev) => prev.filter((item) => item.id !== deletingListing.id));
      success('Hosting deleted permanently.');
      setDeletingListing(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete listing.';
      // Check if deletion was rejected due to active reservations (Section 18 & 19)
      if (errorMsg.includes('upcoming reservations') || errorMsg.includes('unlist')) {
        const target = deletingListing;
        setDeletingListing(null);
        setUnlistPromptListing(target);
      } else {
        error(errorMsg);
        setDeletingListing(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnlistProperty = async () => {
    if (!unlistPromptListing) return;
    setIsUnlisting(true);
    try {
      await apiRequest(`/listings/${unlistPromptListing.id}/unlist`, { method: 'PUT' });
      setListings((prev) =>
        prev.map((item) =>
          item.id === unlistPromptListing.id ? { ...item, is_active: false } : item
        )
      );
      success(`"${unlistPromptListing.house_name}" is now unlisted. Existing guest reservations remain active.`);
      setUnlistPromptListing(null);
    } catch (err: any) {
      error(err.message || 'Failed to unlist property.');
    } finally {
      setIsUnlisting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Host Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your properties, review host bookings from guests, or create a new listing.
          </p>
        </div>

        <Link
          href="/host/create"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#FF385C] hover:bg-[#E00B41] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Listing</span>
        </Link>
      </div>

      {/* Host Navigation Tabs (Section 16) */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
        <button
          type="button"
          className="px-5 py-2 rounded-full text-sm font-bold bg-gray-900 text-white shadow-sm flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4 text-[#FF385C]" />
          <span>My Listings ({listings.length})</span>
        </button>

        <Link
          href="/host/bookings"
          className="px-5 py-2 rounded-full text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <CalendarCheck2 className="w-4 h-4 text-gray-400" />
          <span>Host Bookings</span>
        </Link>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-3xl h-72 w-full"></div>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={`bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                listing.is_active === false ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'
              }`}
            >
              {/* Image & Badges */}
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                <img
                  src={listing.image_url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'}
                  alt={listing.house_name}
                  className="w-full h-full object-cover"
                />
                
                {/* Property Type Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                  {listing.property_type}
                </div>

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{listing.rating ? listing.rating.toFixed(1) : 'New'}</span>
                </div>

                {/* Unlisted Status Banner (Section 20) */}
                {listing.is_active === false && (
                  <div className="absolute bottom-3 left-3 right-3 bg-amber-900/90 text-amber-100 text-xs font-bold py-1 px-3 rounded-full text-center backdrop-blur-sm flex items-center justify-center gap-1.5 shadow-md">
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Unlisted &bull; Not visible in search</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-snug truncate">
                    {listing.house_name}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{listing.street}, {listing.location}, {listing.state}</span>
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-gray-900">
                    &#8377;{listing.price_per_night.toLocaleString()}{' '}
                    <span className="text-xs text-gray-500 font-normal">/ night</span>
                  </p>
                </div>

                {/* Actions: View, Edit, Delete */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => router.push(`/listing/${listing.id}`)}
                    className="py-2 px-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/host/edit/${listing.id}`)}
                    className="py-2 px-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingListing(listing)}
                    className="py-2 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State (Section 23: Host with 0 properties) */
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-gray-50 rounded-3xl border border-gray-200 p-8">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center">
            <Home className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">You don&apos;t currently have any active listings.</h3>
          <p className="text-gray-500 max-w-sm text-sm">
            Publish a property listing to welcome guests from around the world.
          </p>
          <Link
            href="/host/create"
            className="mt-2 px-6 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white text-sm font-semibold rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Listing</span>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal (Section 19: Permanent Deletion) */}
      <DeleteModal
        isOpen={Boolean(deletingListing)}
        title="Delete Property Listing"
        message={`Are you sure you want to permanently delete "${deletingListing?.house_name}"?`}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingListing(null)}
      />

      {/* Unlist Property Modal (Section 19: Property has active reservations) */}
      {unlistPromptListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-amber-200 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Reservations Active</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                This property has upcoming reservations. You cannot permanently delete it while these reservations are active.
              </p>
              <p className="text-xs font-semibold text-gray-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                You can unlist the property instead. It will disappear from search while preserving your guests&apos; bookings.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnlistPromptListing(null)}
                disabled={isUnlisting}
                className="flex-1 py-2.5 px-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlistProperty}
                disabled={isUnlisting}
                className="flex-1 py-2.5 px-4 rounded-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-sm font-bold shadow-md transition-all disabled:opacity-50"
              >
                {isUnlisting ? 'Unlisting...' : 'Unlist Property'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function HostPage() {
  return (
    <ProtectedRoute>
      <HostDashboardContent />
    </ProtectedRoute>
  );
}
