'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Users, MapPin, CheckCircle, Ban, ArrowRight, AlertTriangle } from 'lucide-react';
import { Booking } from '@/types';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function BookingsContent() {
  const router = useRouter();
  const { success, error } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<Booking[]>('/bookings/my');
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await apiRequest(`/bookings/${bookingId}/cancel`, { method: 'PUT' });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
      success('Booking cancelled successfully. Your reservation dates are now released.');
    } catch (err: any) {
      error(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Trips</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review reservations booked by you as a guest, trip dates, and booking status.
        </p>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-3xl h-44 w-full"></div>
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-stretch gap-6 ${
                booking.status === 'cancelled'
                  ? 'border-gray-200 opacity-75 bg-gray-50/50'
                  : 'border-gray-300'
              }`}
            >
              {/* Thumbnail */}
              <div
                onClick={() => router.push(`/listing/${booking.listing_id}`)}
                className="relative w-full md:w-56 h-48 md:h-auto shrink-0 rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group"
              >
                <img
                  src={booking.image_url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'}
                  alt={booking.house_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                      booking.status === 'confirmed'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    {booking.status === 'confirmed' ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Confirmed
                      </>
                    ) : (
                      <>
                        <Ban className="w-3 h-3" />
                        Cancelled
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Info Column */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        onClick={() => router.push(`/listing/${booking.listing_id}`)}
                        className="text-xl font-bold text-gray-900 hover:text-[#FF385C] cursor-pointer transition-colors"
                      >
                        {booking.house_name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{booking.location}, {booking.state}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Total Paid</p>
                      <p className="text-xl font-extrabold text-gray-900">
                        &#8377;{booking.total_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Dates & Guests row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 pt-2">
                    <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200">
                      <Calendar className="w-4 h-4 text-[#FF385C]" />
                      <span className="font-semibold">{booking.start_date}</span>
                      <span className="text-gray-400">&rarr;</span>
                      <span className="font-semibold">{booking.end_date}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200">
                      <Users className="w-4 h-4 text-[#FF385C]" />
                      <span className="font-medium">{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</span>
                    </div>

                    {booking.host_name && (
                      <div className="text-xs text-gray-500">
                        Hosted by <span className="font-semibold text-gray-800">{booking.host_name}</span> ({booking.host_phone || 'Contact provided'})
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-400">
                    Booked on {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'Recently'}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/listing/${booking.listing_id}`)}
                      className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      View Home
                    </button>

                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-gray-50 rounded-3xl border border-gray-200 p-8">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">You don&apos;t have any bookings yet</h3>
          <p className="text-gray-500 max-w-sm text-sm">
            Time to dust off your bags and start planning your next getaway.
          </p>
          <Link
            href="/"
            className="mt-2 px-6 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white text-sm font-semibold rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Start Exploring</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <BookingsContent />
    </ProtectedRoute>
  );
}
