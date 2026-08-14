'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { Review } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiRequest } from '@/lib/api';

interface ReviewSectionProps {
  listingId: number;
  initialReviews: Review[];
  avgRating: number | null;
  reviewCount: number;
}

export function ReviewSection({
  listingId,
  initialReviews,
  avgRating,
  reviewCount,
}: ReviewSectionProps) {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      error('You must be logged in to leave a review.');
      return;
    }

    if (!comment.trim()) {
      error('Please write a brief comment sharing your experience.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReview = await apiRequest<Review>(`/listings/${listingId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      setReviews((prev) => [newReview, ...prev]);
      setComment('');
      setRating(5);
      success('Review submitted! Thank you for your feedback.');
    } catch (err: any) {
      error(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedAvg = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 'New';

  return (
    <div className="pt-10 border-t border-gray-200 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
        <h2 className="text-2xl font-bold text-gray-900">
          {calculatedAvg} &middot; {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </h2>
      </div>

      {/* Write a review form (if user is logged in) */}
      {user ? (
        <form
          onSubmit={handleSubmitReview}
          className="bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#FF385C]" />
              Leave a Review
            </h3>

            {/* Star selector */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-600 mr-2">Your Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-6 h-6 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 fill-transparent'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your stay experience, the hospitality, location, amenities, and tips for future guests..."
            className="w-full p-4 rounded-2xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none bg-white resize-none"
            required
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="px-6 py-2.5 rounded-full bg-gray-900 hover:bg-black text-white text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Post Review'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center text-sm text-gray-600">
          <span>Log in to leave a review for this property.</span>
        </div>
      )}

      {/* Review List */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF385C] to-rose-400 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {rev.user_name ? rev.user_name.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{rev.user_name}</h4>
                    <p className="text-xs text-gray-400">
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recent'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full text-xs font-bold text-amber-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{rev.rating.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">
          No reviews yet. Be the first guest to leave a review!
        </p>
      )}
    </div>
  );
}
