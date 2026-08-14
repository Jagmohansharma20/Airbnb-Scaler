'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ShieldCheck, Users, Calendar } from 'lucide-react';
import { ListingDetail } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiRequest } from '@/lib/api';
import { MockPaymentModal } from './MockPaymentModal';

interface BookingCardProps {
  listing: ListingDetail;
}

export function BookingCard({ listing }: BookingCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const today = new Date().toISOString().split('T')[0];

  // Calculate number of nights
  const numberOfNights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [startDate, endDate]);

  const basePrice = numberOfNights * listing.price_per_night;
  const serviceFee = numberOfNights > 0 ? 1500 : 0;
  const totalPrice = basePrice + serviceFee;

  // Check if selected dates overlap with existing booked dates
  const isOverlap = useMemo(() => {
    if (!startDate || !endDate || !listing.booked_dates) return false;
    return listing.booked_dates.some(
      (b) => startDate < b.end_date && endDate > b.start_date
    );
  }, [startDate, endDate, listing.booked_dates]);

  const handleStartBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`);
      return;
    }

    if (!startDate || !endDate) {
      error('Please select both check-in and check-out dates.');
      return;
    }

    if (startDate >= endDate) {
      error('Check-out date must be after check-in date.');
      return;
    }

    if (isOverlap) {
      error('This home is not available for the selected dates. Please choose different dates.');
      return;
    }

    if (guests > listing.maximum_guests) {
      error(`Maximum guests allowed is ${listing.maximum_guests}.`);
      return;
    }

    // Open mock payment modal
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setIsModalOpen(false);
    setIsSubmitting(true);

    try {
      await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          listing_id: listing.id,
          start_date: startDate,
          end_date: endDate,
          guests,
        }),
      });

      success('Booking confirmed! Pack your bags.');
      router.push('/bookings');
    } catch (err: any) {
      error(err.message || 'Failed to create booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="sticky top-28 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* Header: Price & Rating */}
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              &#8377;{listing.price_per_night.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm"> / night</span>
          </div>

          <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{listing.rating ? listing.rating.toFixed(1) : 'New'}</span>
            {listing.review_count > 0 && (
              <span className="text-gray-400 font-normal">
                &middot; {listing.review_count} {listing.review_count === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleStartBooking} className="space-y-4">
          <div className="border border-gray-300 rounded-2xl overflow-hidden divide-y divide-gray-300">
            
            {/* Dates Row */}
            <div className="grid grid-cols-2 divide-x divide-gray-300">
              <div className="p-3 bg-white hover:bg-gray-50 transition-colors">
                <label className="block text-[10px] font-extrabold uppercase text-gray-700 tracking-wider">
                  Check-in
                </label>
                <input
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value >= endDate) {
                      setEndDate('');
                    }
                  }}
                  className="w-full text-xs font-semibold text-gray-900 bg-transparent border-none outline-none p-0 cursor-pointer focus:ring-0"
                  required
                />
              </div>

              <div className="p-3 bg-white hover:bg-gray-50 transition-colors">
                <label className="block text-[10px] font-extrabold uppercase text-gray-700 tracking-wider">
                  Check-out
                </label>
                <input
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-900 bg-transparent border-none outline-none p-0 cursor-pointer focus:ring-0"
                  required
                />
              </div>
            </div>

            {/* Guests Selector */}
            <div className="p-3 bg-white hover:bg-gray-50 transition-colors">
              <label className="block text-[10px] font-extrabold uppercase text-gray-700 tracking-wider">
                Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full text-xs font-semibold text-gray-900 bg-transparent border-none outline-none p-0 cursor-pointer focus:ring-0"
              >
                {Array.from({ length: listing.maximum_guests }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'} (max {listing.maximum_guests})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Booked dates indicator if any */}
          {isOverlap && (
            <p className="text-xs font-medium text-[#FF385C] bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              Selected dates overlap an existing reservation. Please choose different dates.
            </p>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || isOverlap || (Boolean(startDate && endDate) && numberOfNights <= 0)}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-[#FF385C] hover:bg-[#E00B41] active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
          >
            <span>{user ? 'Pay & Book' : 'Login to Book'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 font-medium">
          You won&apos;t be charged yet &middot; Mock payment
        </p>

        {/* Dynamic Price Breakdown */}
        {numberOfNights > 0 && !isOverlap && (
          <div className="space-y-3 pt-4 border-t border-gray-100 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="underline">
                &#8377;{listing.price_per_night.toLocaleString()} &times; {numberOfNights} {numberOfNights === 1 ? 'night' : 'nights'}
              </span>
              <span>&#8377;{basePrice.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="underline">Airbnb service fee</span>
              <span>&#8377;{serviceFee.toLocaleString()}</span>
            </div>

            <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-100">
              <span>Total before taxes</span>
              <span>&#8377;{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Security badge */}
        <div className="flex items-center gap-3 pt-2 text-xs text-gray-500">
          <ShieldCheck className="w-5 h-5 text-[#008489] shrink-0" />
          <span>Airbnb Protection: Safe, protected, and fully refundable until 48 hours prior to check-in.</span>
        </div>
      </div>

      {/* Mock Payment Flow Modal */}
      <MockPaymentModal
        isOpen={isModalOpen}
        totalPrice={totalPrice}
        houseName={listing.house_name}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
