'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Star, 
  Home, 
  Building2, 
  Hotel, 
  Check, 
  SlidersHorizontal 
} from 'lucide-react';

export interface FilterValues {
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  amenities: string[];
  minRating?: number;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterValues;
  onApply: (newFilters: FilterValues) => void;
  onClear: () => void;
}

const PROPERTY_TYPES = [
  { label: 'All', icon: null },
  { label: 'House', icon: Home },
  { label: 'Apartment', icon: Building2 },
  { label: 'Hotel', icon: Hotel },
];

const AMENITY_LIST = [
  'WiFi', 'AC', 'Kitchen', 'Free Parking',
  'TV', 'Fridge', 'Washing Machine', 'Gym'
];

const RATING_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
  { label: '4.8+', value: 4.8 },
];

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onClear,
}: FilterModalProps) {
  const [minPrice, setMinPrice] = useState<string>(filters.minPrice ? String(filters.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState<string>(filters.maxPrice ? String(filters.maxPrice) : '');
  const [propertyType, setPropertyType] = useState<string>(filters.propertyType || 'All');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(filters.amenities || []);
  const [minRating, setMinRating] = useState<number>(filters.minRating || 0);

  // Sync state when opened with active filters
  useEffect(() => {
    if (isOpen) {
      setMinPrice(filters.minPrice ? String(filters.minPrice) : '');
      setMaxPrice(filters.maxPrice ? String(filters.maxPrice) : '');
      setPropertyType(filters.propertyType || 'All');
      setSelectedAmenities(filters.amenities || []);
      setMinRating(filters.minRating || 0);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleApply = () => {
    const minP = minPrice ? parseFloat(minPrice) : undefined;
    const maxP = maxPrice ? parseFloat(maxPrice) : undefined;

    onApply({
      minPrice: minP && minP > 0 ? minP : undefined,
      maxPrice: maxP && maxP > 0 ? maxP : undefined,
      propertyType: propertyType !== 'All' ? propertyType : undefined,
      amenities: selectedAmenities,
      minRating: minRating > 0 ? minRating : undefined,
    });
    onClose();
  };

  const handleClearAll = () => {
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('All');
    setSelectedAmenities([]);
    setMinRating(0);
    onClear();
    onClose();
  };

  // Count active filters
  const activeCount =
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (propertyType && propertyType !== 'All' ? 1 : 0) +
    selectedAmenities.length +
    (minRating > 0 ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#FF385C]" />
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close filters modal"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 divide-y divide-gray-100">
          
          {/* 1. Price Range */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Price Range</h3>
              <p className="text-xs text-gray-500 mt-0.5">Nightly prices before taxes and fees</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-gray-300 rounded-2xl focus-within:border-[#FF385C] focus-within:ring-1 focus-within:ring-[#FF385C] transition-all">
                <label className="block text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                  Minimum Price (&#8377;)
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-bold text-gray-700">&#8377;</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full text-base font-semibold text-gray-900 bg-transparent border-none outline-none p-0 focus:ring-0"
                  />
                </div>
              </div>

              <div className="p-3 border border-gray-300 rounded-2xl focus-within:border-[#FF385C] focus-within:ring-1 focus-within:ring-[#FF385C] transition-all">
                <label className="block text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                  Maximum Price (&#8377;)
                </label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-bold text-gray-700">&#8377;</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="10000+"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full text-base font-semibold text-gray-900 bg-transparent border-none outline-none p-0 focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Quick Price Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setMinPrice('0'); setMaxPrice('4000'); }}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors text-gray-700"
              >
                Under &#8377;4,000
              </button>
              <button
                type="button"
                onClick={() => { setMinPrice('4000'); setMaxPrice('7000'); }}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors text-gray-700"
              >
                &#8377;4,000 &ndash; &#8377;7,000
              </button>
              <button
                type="button"
                onClick={() => { setMinPrice('7000'); setMaxPrice(''); }}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors text-gray-700"
              >
                &#8377;7,000+
              </button>
            </div>
          </div>

          {/* 2. Property Type */}
          <div className="pt-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Property Type</h3>
              <p className="text-xs text-gray-500 mt-0.5">Filter by the type of space</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PROPERTY_TYPES.map((pt) => {
                const isSelected = propertyType.toLowerCase() === pt.label.toLowerCase();
                const Icon = pt.icon;
                return (
                  <button
                    type="button"
                    key={pt.label}
                    onClick={() => setPropertyType(pt.label)}
                    className={`p-3.5 rounded-2xl border text-sm font-semibold flex flex-col items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    {Icon ? <Icon className="w-5 h-5" /> : <span className="text-base font-bold">&infin;</span>}
                    <span>{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Amenities */}
          <div className="pt-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Amenities</h3>
              <p className="text-xs text-gray-500 mt-0.5">Select must-have features for your stay</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AMENITY_LIST.map((amenity) => {
                const isChecked = selectedAmenities.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-3 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all text-left ${
                      isChecked
                        ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        isChecked ? 'border-white bg-white text-gray-900' : 'border-gray-400'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Minimum Rating */}
          <div className="pt-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Minimum Rating</h3>
              <p className="text-xs text-gray-500 mt-0.5">Show only highly rated stays</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RATING_OPTIONS.map((opt) => {
                const isSelected = minRating === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.label}
                    onClick={() => setMinRating(opt.value)}
                    className={`p-3 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-[#FF385C] bg-rose-50 text-[#FF385C] shadow-sm font-bold'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {opt.value > 0 && <Star className="w-4 h-4 fill-amber-400 text-amber-500" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 underline transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear All</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-3 rounded-full bg-[#FF385C] hover:bg-[#E00B41] active:scale-95 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>Apply Filters</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[#FF385C] text-xs font-extrabold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
