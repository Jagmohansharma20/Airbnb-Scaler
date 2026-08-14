'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CalendarCheck2, 
  LayoutDashboard, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Users, 
  User, 
  Mail, 
  Phone, 
  CheckCircle, 
  Ban, 
  EyeOff, 
  Inbox
} from 'lucide-react';
import { HostBooking } from '@/types';
import { apiRequest } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function HostBookingsContent() {
  const router = useRouter();
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHostBookings = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<HostBooking[]>('/host/bookings');
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHostBookings();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Host Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review upcoming and past reservations made by travelers on your hosted properties.
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
        <Link
          href="/host"
          className="px-5 py-2 rounded-full text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4 text-gray-400" />
          <span>My Listings</span>
        </Link>

        <button
          type="button"
          className="px-5 py-2 rounded-full text-sm font-bold bg-gray-900 text-white shadow-sm flex items-center gap-2"
        >
          <CalendarCheck2 className="w-4 h-4 text-[#FF385C]" />
          <span>Host Bookings ({bookings.length})</span>
        </button>
      </div>

      {/* Host Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-3xl h-44 w-full"></div>
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((b) => (
            <div
              key={b.id}
              className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-stretch gap-6 ${
                b.status === 'cancelled'
                  ? 'border-gray-200 opacity-80 bg-gray-50/50'
                  : 'border-gray-300'
              }`}
            >
              {/* Property Image & Status */}
              <div
                onClick={() => router.push(`/listing/${b.listing_id}`)}
                className="relative w-full md:w-56 h-48 md:h-auto shrink-0 rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group"
              >
                <img
                  src={b.image_url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'}
                  alt={b.house_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    {b.status === 'confirmed' ? (
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

                  {b.is_active === false && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-800 text-amber-100 shadow-sm">
                      <EyeOff className="w-2.5 h-2.5" />
                      Unlisted Home
                    </span>
                  )}
                </div>
              </div>

              {/* Booking & Guest Info */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3
                        onClick={() => router.push(`/listing/${b.listing_id}`)}
                        className="text-xl font-bold text-gray-900 hover:text-[#FF385C] cursor-pointer transition-colors"
                      >
                        {b.house_name}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{b.location}, {b.state}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Total Payout</p>
                      <p className="text-xl font-extrabold text-gray-900">
                        &#8377;{b.total_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Dates, Guests & Nights */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-gray-700 pt-1">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                      <Calendar className="w-4 h-4 text-[#FF385C]" />
                      <span className="font-semibold">{b.start_date}</span>
                      <span className="text-gray-400">&rarr;</span>
                      <span className="font-semibold">{b.end_date}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                      <Users className="w-4 h-4 text-[#FF385C]" />
                      <span className="font-medium">{b.guests} {b.guests === 1 ? 'Guest' : 'Guests'}</span>
                    </div>

                    <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 font-medium text-gray-700">
                      {b.nights || 1} {b.nights === 1 ? 'Night' : 'Nights'}
                    </div>

                    {b.price_per_night && (
                      <div className="text-xs text-gray-500 hidden sm:block">
                        &#8377;{Math.round(b.price_per_night).toLocaleString()} / night
                      </div>
                    )}
                  </div>

                  {/* Guest Contact Details Card (Section 14 & 15) */}
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-gray-900">
                      <User className="w-3.5 h-3.5 text-[#FF385C]" />
                      <span>Guest: {b.guest_name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{b.guest_email}</span>
                    </div>

                    {b.guest_phone && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{b.guest_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Feature 4 & 7: Guest Message Display (Section 23, 24, 37) */}
                  <div className="p-3.5 rounded-2xl border bg-rose-50/40 border-rose-100/80 space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <span>Message from guest:</span>
                    </p>
                    <p className={`text-xs ${
                      b.guest_message && b.guest_message.trim() 
                        ? 'text-gray-800 font-medium' 
                        : 'text-gray-400 italic'
                    }`}>
                      {b.guest_message && b.guest_message.trim() 
                        ? `"${b.guest_message.trim()}"` 
                        : 'No message provided'}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
                  <span>Reserved on {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recently'}</span>
                  <button
                    onClick={() => router.push(`/listing/${b.listing_id}`)}
                    className="font-bold text-[#FF385C] hover:underline"
                  >
                    View Listing &rarr;
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-gray-50 rounded-3xl border border-gray-200 p-8">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No host bookings yet</h3>
          <p className="text-gray-500 max-w-sm text-sm">
            When travelers book stays at your published properties, their reservation details will appear here.
          </p>
        </div>
      )}

    </div>
  );
}

export default function HostBookingsPage() {
  return (
    <ProtectedRoute>
      <HostBookingsContent />
    </ProtectedRoute>
  );
}
