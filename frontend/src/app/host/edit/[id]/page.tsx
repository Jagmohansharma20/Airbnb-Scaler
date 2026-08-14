'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiRequest } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ListingDetail } from '@/types';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';

const AMENITY_OPTIONS = [
  'TV', 'Fridge', 'AC', 'WiFi', 'Free Parking',
  'Washing Machine', 'Gym', 'Kitchen'
];

const UNIQUENESS_OPTIONS = [
  'Peaceful', 'Scenic View', 'Cozy', 'Luxury',
  'Family Friendly', 'Nature Retreat', 'Central Location'
];

function EditHostingContent({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [houseName, setHouseName] = useState('');
  const [street, setStreet] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerNight, setPricePerNight] = useState<string>('');
  const [maximumGuests, setMaximumGuests] = useState<number>(4);
  const [propertyType, setPropertyType] = useState<string>('House');
  const [bathroomType, setBathroomType] = useState<string>('Attached');
  const [phone, setPhone] = useState('');

  // 3 Images
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');
  const [image3, setImage3] = useState('');

  // Selected Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Selected Uniqueness
  const [selectedUniqueness, setSelectedUniqueness] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState('');

  useEffect(() => {
    async function loadListing() {
      setIsLoading(true);
      try {
        const data = await apiRequest<ListingDetail>(`/listings/${id}`);
        
        // Authorization check: only owner can edit
        if (user && data.host_id !== user.id) {
          error('You can only edit properties that you own.');
          router.push('/host');
          return;
        }

        setHouseName(data.house_name);
        setStreet(data.street);
        setLocation(data.location);
        setState(data.state);
        setDescription(data.description);
        setPricePerNight(String(data.price_per_night));
        setMaximumGuests(data.maximum_guests);
        setPropertyType(data.property_type);
        setBathroomType(data.bathroom_type);
        setPhone(data.host.phone || user?.phone || '');

        if (data.images && data.images.length > 0) {
          setImage1(data.images[0] || '');
          setImage2(data.images[1] || '');
          setImage3(data.images[2] || '');
        }

        setSelectedAmenities(data.amenities || []);

        const standardUni = (data.uniqueness || []).filter((u) => UNIQUENESS_OPTIONS.includes(u));
        const customUni = (data.uniqueness || []).filter((u) => !UNIQUENESS_OPTIONS.includes(u));
        setSelectedUniqueness(standardUni);
        if (customUni.length > 0) {
          setCustomFeature(customUni.join(', '));
        }
      } catch (err: any) {
        error(err.message || 'Could not load listing data.');
        router.push('/host');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadListing();
    }
  }, [id, user, router, error]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleUniqueness = (feat: string) => {
    setSelectedUniqueness((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!houseName.trim() || !street.trim() || !location.trim() || !state.trim() || !description.trim()) {
      error('Please fill in all required property information fields.');
      return;
    }

    if (!image1.trim() || !image2.trim() || !image3.trim()) {
      error('Please provide all 3 image URLs.');
      return;
    }

    const price = parseFloat(pricePerNight);
    if (isNaN(price) || price <= 0) {
      error('Please enter a valid price per night.');
      return;
    }

    const finalUniqueness = [...selectedUniqueness];
    if (customFeature.trim()) {
      finalUniqueness.push(customFeature.trim());
    }

    setIsSubmitting(true);

    try {
      await apiRequest(`/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          house_name: houseName.trim(),
          street: street.trim(),
          location: location.trim(),
          state: state.trim(),
          description: description.trim(),
          price_per_night: price,
          maximum_guests: maximumGuests,
          property_type: propertyType,
          bathroom_type: bathroomType,
          phone: phone.trim() || undefined,
          images: [image1.trim(), image2.trim(), image3.trim()],
          amenities: selectedAmenities,
          uniqueness: finalUniqueness,
        }),
      });

      success('Hosting updated successfully!');
      router.push('/host');
    } catch (err: any) {
      error(err.message || 'Failed to update listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#FF385C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm">Loading hosting data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Hosting</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update photos, pricing, amenities, and details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Host Contact Info */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">
            1. Host Contact Info
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Host Name
              </label>
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Host Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Host Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Property Overview */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">
            2. Property Overview
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                House / Listing Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Location / City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  State / Region <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Price Per Night (&#8377;) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Maximum Guests <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={30}
                  value={maximumGuests}
                  onChange={(e) => setMaximumGuests(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Property Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none bg-white cursor-pointer"
                >
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Hotel">Hotel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Bathroom <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-4 pt-2.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="bathroom"
                      value="Attached"
                      checked={bathroomType === 'Attached'}
                      onChange={() => setBathroomType('Attached')}
                      className="text-[#FF385C] focus:ring-[#FF385C]"
                    />
                    Attached
                  </label>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="bathroom"
                      value="Not Attached"
                      checked={bathroomType === 'Not Attached'}
                      onChange={() => setBathroomType('Not Attached')}
                      className="text-[#FF385C] focus:ring-[#FF385C]"
                    />
                    Not Attached
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Exactly 3 Image URLs */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">3. Property Photos (3 Image URLs)</h2>
            <p className="text-xs text-gray-500 mt-0.5">Image 1 is used as the cover thumbnail.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Image 1 URL (Cover Photo) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={image1}
                onChange={(e) => setImage1(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Image 2 URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={image2}
                  onChange={(e) => setImage2(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Image 3 URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={image3}
                  onChange={(e) => setImage3(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Thumbnails Preview */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[image1, image2, image3].map((img, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  {img && (
                    <img
                      src={img}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                    Photo {i + 1} {i === 0 && '(Cover)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 4: Amenities */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">4. Amenities</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AMENITY_OPTIONS.map((amenity) => {
              const isChecked = selectedAmenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-3 rounded-2xl border text-sm font-semibold flex items-center gap-3 transition-all ${
                    isChecked
                      ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isChecked ? 'border-white bg-white text-gray-900' : 'border-gray-400'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{amenity}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 5: Uniqueness */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">5. Special Features & Uniqueness</h2>

          <div className="flex flex-wrap gap-2.5">
            {UNIQUENESS_OPTIONS.map((feat) => {
              const isChecked = selectedUniqueness.includes(feat);
              return (
                <button
                  type="button"
                  key={feat}
                  onClick={() => toggleUniqueness(feat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    isChecked
                      ? 'bg-rose-50 border-[#FF385C] text-[#FF385C] shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {isChecked ? `✓ ${feat}` : `+ ${feat}`}
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Other Special Feature <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              placeholder="e.g. Private Stargazing Telescope"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3.5 rounded-full border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 rounded-full bg-[#FF385C] hover:bg-[#E00B41] active:scale-95 text-white text-base font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save & Update Hosting</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function EditHostingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ProtectedRoute>
      <EditHostingContent id={resolvedParams.id} />
    </ProtectedRoute>
  );
}
