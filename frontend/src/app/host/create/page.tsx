'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiRequest } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  Building2, 
  Home, 
  Hotel, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Plus, 
  ArrowLeft, 
  Loader2 
} from 'lucide-react';

const AMENITY_OPTIONS = [
  'TV', 'Fridge', 'AC', 'WiFi', 'Free Parking',
  'Washing Machine', 'Gym', 'Kitchen'
];

const UNIQUENESS_OPTIONS = [
  'Peaceful', 'Scenic View', 'Cozy', 'Luxury',
  'Family Friendly', 'Nature Retreat', 'Central Location'
];

const SAMPLE_IMAGE_PRESETS = [
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80"
];

function CreateHostingContent() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [houseName, setHouseName] = useState('');
  const [street, setStreet] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerNight, setPricePerNight] = useState<string>('4500');
  const [maximumGuests, setMaximumGuests] = useState<number>(4);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [beds, setBeds] = useState<number>(3);
  const [propertyType, setPropertyType] = useState<string>('House');
  const [placeType, setPlaceType] = useState<string>('Entire place');
  const [bathroomType, setBathroomType] = useState<string>('Attached');
  const [phone, setPhone] = useState(user?.phone || '');

  // 3 Images
  const [image1, setImage1] = useState(SAMPLE_IMAGE_PRESETS[0]);
  const [image2, setImage2] = useState(SAMPLE_IMAGE_PRESETS[1]);
  const [image3, setImage3] = useState(SAMPLE_IMAGE_PRESETS[2]);

  // Selected Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'WiFi', 'AC', 'Kitchen', 'Free Parking'
  ]);

  // Selected Uniqueness
  const [selectedUniqueness, setSelectedUniqueness] = useState<string[]>([
    'Luxury', 'Peaceful'
  ]);
  const [customFeature, setCustomFeature] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!propertyType.trim()) {
      error('Please select a property type.');
      return;
    }

    if (!placeType.trim()) {
      error('Please select a place type.');
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

    if (bedrooms < 1 || beds < 1) {
      error('Bedrooms and Beds must be positive integers (at least 1).');
      return;
    }

    const finalUniqueness = [...selectedUniqueness];
    if (customFeature.trim()) {
      finalUniqueness.push(customFeature.trim());
    }

    setIsSubmitting(true);

    try {
      await apiRequest('/listings', {
        method: 'POST',
        body: JSON.stringify({
          house_name: houseName.trim(),
          street: street.trim(),
          location: location.trim(),
          state: state.trim(),
          description: description.trim(),
          price_per_night: price,
          maximum_guests: maximumGuests,
          bedrooms: Math.max(1, Math.round(bedrooms)),
          beds: Math.max(1, Math.round(beds)),
          property_type: propertyType,
          place_type: placeType,
          bathroom_type: bathroomType,
          phone: phone.trim() || undefined,
          images: [image1.trim(), image2.trim(), image3.trim()],
          amenities: selectedAmenities,
          uniqueness: finalUniqueness,
        }),
      });

      // Update auth context state to host role
      await refreshUser();

      success('Your home has been listed successfully! You are now a host.');
      router.push('/host');
    } catch (err: any) {
      error(err.message || 'Failed to publish listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Become a Host</h1>
          <p className="text-sm text-gray-500 mt-0.5">List your house or apartment and start welcoming travelers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Host Information (Pre-filled from account) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">
            1. Host Information
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
                placeholder="e.g. The Heritage Havelock Villa with Private Pool"
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
                  placeholder="14 Shanti Path"
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
                  placeholder="Delhi"
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
                  placeholder="Delhi"
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
                placeholder="Describe your space, ambiance, surroundings, and house rules..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  max={50}
                  value={maximumGuests}
                  onChange={(e) => setMaximumGuests(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Bedrooms <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Beds <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={beds}
                  onChange={(e) => setBeds(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm font-semibold focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>

              {/* Property Type Dropdown */}
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
                  <option value="Villa">Villa</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Cottage">Cottage</option>
                  <option value="Cabin">Cabin</option>
                  <option value="Guesthouse">Guesthouse</option>
                  <option value="Resort">Resort</option>
                </select>
              </div>

              {/* Place Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Place Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={placeType}
                  onChange={(e) => setPlaceType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none bg-white cursor-pointer"
                >
                  <option value="Entire place">Entire place</option>
                  <option value="Private room">Private room</option>
                  <option value="Hotel room">Hotel room</option>
                  <option value="Shared room">Shared room</option>
                </select>
              </div>

              {/* Bathroom Type Radio */}
              <div className="sm:col-span-2">
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

        {/* Step 3: Exactly 3 Image URLs (Section 34) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">3. Property Photos (Exactly 3 Image URLs)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Image 1 will be featured as the primary listing card thumbnail on the Home page.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Image 1 URL (Primary / Home Card Thumbnail) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={image1}
                onChange={(e) => setImage1(e.target.value)}
                placeholder="https://images.unsplash.com/..."
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
                  placeholder="https://images.unsplash.com/..."
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
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Live Thumbnails Preview */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[image1, image2, image3].map((img, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner">
                  {img ? (
                    <img
                      src={img}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs font-medium">
                      Photo {i + 1}
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                    Photo {i + 1} {i === 0 && '(Cover)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 4: Amenities (Section 32) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">4. Amenities</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select all amenities available to guests.</p>
          </div>

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

        {/* Step 5: Uniqueness & Special Features (Section 35) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">5. Special Features & Uniqueness</h2>
            <p className="text-xs text-gray-500 mt-0.5">Highlight what makes your place stand out.</p>
          </div>

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
              placeholder="e.g. Private Stargazing Telescope, Infinity Plunge Pool"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Submit Bar (Section 36) */}
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
                <span>Publishing Listing...</span>
              </>
            ) : (
              <span>Finish / Create Hosting</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function CreateHostingPage() {
  return (
    <ProtectedRoute>
      <CreateHostingContent />
    </ProtectedRoute>
  );
}
