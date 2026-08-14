'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SearchBar } from '@/components/SearchBar';
import { ListingCard } from '@/components/ListingCard';
import { FilterModal, FilterValues } from '@/components/FilterModal';
import { ListingSummary } from '@/types';
import { apiRequest } from '@/lib/api';
import { 
  Palmtree, 
  Building2, 
  Trees, 
  Sparkles, 
  Mountain, 
  Waves, 
  Castle, 
  Home as HomeIcon,
  SearchX,
  SlidersHorizontal,
  Map as MapIcon,
  MapPinOff,
  RotateCcw,
  List
} from 'lucide-react';

// Dynamically import LocationMap to prevent SSR window/document errors
const LocationMap = dynamic(
  () => import('@/components/LocationMap').then((mod) => mod.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-72 rounded-3xl bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-sm">
        Loading interactive map...
      </div>
    ),
  }
);

const CATEGORIES = [
  { label: 'All Homes', icon: HomeIcon },
  { label: 'Villas', icon: Castle },
  { label: 'Beachfront', icon: Waves },
  { label: 'Cabins', icon: Trees },
  { label: 'Iconic Cities', icon: Building2 },
  { label: 'Mountains', icon: Mountain },
  { label: 'Tropical', icon: Palmtree },
  { label: 'Luxe', icon: Sparkles },
];

export default function HomePage() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Homes');
  
  // Search Bar State
  const [searchParams, setSearchParams] = useState<{
    location?: string;
    start_date?: string;
    end_date?: string;
    guests?: number;
  }>({});

  // Filter Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [filterParams, setFilterParams] = useState<FilterValues>({
    amenities: [],
  });

  // Map Toggle (Hidden by default, opens only when user clicks Show Map)
  const [showMap, setShowMap] = useState<boolean>(false);

  // Active filter count
  const activeFilterCount =
    (filterParams.minPrice ? 1 : 0) +
    (filterParams.maxPrice ? 1 : 0) +
    (filterParams.propertyType ? 1 : 0) +
    (filterParams.amenities.length > 0 ? filterParams.amenities.length : 0) +
    (filterParams.minRating ? 1 : 0);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      
      // Search parameters
      if (searchParams.location) query.append('location', searchParams.location);
      if (searchParams.start_date) query.append('start_date', searchParams.start_date);
      if (searchParams.end_date) query.append('end_date', searchParams.end_date);
      if (searchParams.guests) query.append('guests', String(searchParams.guests));

      // Filter parameters
      if (filterParams.minPrice) query.append('min_price', String(filterParams.minPrice));
      if (filterParams.maxPrice) query.append('max_price', String(filterParams.maxPrice));
      if (filterParams.propertyType) query.append('property_type', filterParams.propertyType);
      if (filterParams.amenities.length > 0) query.append('amenities', filterParams.amenities.join(','));
      if (filterParams.minRating) query.append('min_rating', String(filterParams.minRating));

      const queryString = query.toString() ? `?${query.toString()}` : '';
      const data = await apiRequest<ListingSummary[]>(`/listings${queryString}`);
      setListings(data);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, filterParams]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (params: {
    location?: string;
    start_date?: string;
    end_date?: string;
    guests?: number;
  }) => {
    setSearchParams(params);
  };

  const handleSelectMapLocation = (locationName: string) => {
    setSearchParams((prev) => ({ ...prev, location: locationName }));
  };

  const handleClearMapLocation = () => {
    setSearchParams((prev) => ({ ...prev, location: undefined }));
  };

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilterParams(newFilters);
  };

  const handleClearFilters = () => {
    setFilterParams({ amenities: [] });
  };

  const handleResetAll = () => {
    setSearchParams({});
    setFilterParams({ amenities: [] });
    setSelectedCategory('All Homes');
  };

  const handleFavoriteChange = (listingId: number, isFav: boolean) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, is_favourite: isFav } : l))
    );
  };

  const hasAnyFilter = Boolean(
    searchParams.location ||
    searchParams.start_date ||
    searchParams.end_date ||
    (searchParams.guests && searchParams.guests > 1) ||
    activeFilterCount > 0
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Airbnb Search Bar */}
      <SearchBar onSearch={handleSearch} initialValues={searchParams} />

      {/* 2. Category Carousel + Filters Button + Map Toggle */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 pt-2">
        
        {/* Categories (scrollable) */}
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none select-none flex-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`flex flex-col items-center gap-2 pb-1 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  isSelected
                    ? 'border-gray-900 text-gray-900 font-bold opacity-100'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300 opacity-70 hover:opacity-100'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right action buttons: Filters & Map Toggle */}
        <div className="flex items-center gap-2.5 shrink-0 pl-2">
          
          {/* Filters Button (Section 2) */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 ${
              activeFilterCount > 0
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white hover:border-gray-900 text-gray-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FF385C] text-white text-[11px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Map View Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMap((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full border text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 ${
              showMap
                ? 'border-gray-900 bg-gray-50 text-gray-900'
                : 'border-gray-300 bg-white hover:border-gray-900 text-gray-700'
            }`}
            title={showMap ? 'Hide location map' : 'Show location map'}
          >
            <MapIcon className="w-4 h-4 text-[#FF385C]" />
            <span className="hidden sm:inline">{showMap ? 'Hide Map' : 'Show Map'}</span>
          </button>
        </div>

      </div>

      {/* 3. Interactive Location Map (Feature 2: Leaflet + OpenStreetMap) */}
      {showMap && (
        <LocationMap
          selectedLocation={searchParams.location}
          onSelectLocation={handleSelectMapLocation}
          onClearLocation={searchParams.location ? handleClearMapLocation : undefined}
        />
      )}

      {/* Active Filter Chips Bar (if filters are active) */}
      {hasAnyFilter && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-gray-50 p-3 rounded-2xl border border-gray-200">
          <span className="font-bold text-gray-700">Active Filters:</span>
          
          {searchParams.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-300 text-gray-800 font-semibold">
              Location: {searchParams.location}
            </span>
          )}

          {searchParams.start_date && searchParams.end_date && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-300 text-gray-800 font-semibold">
              Dates: {searchParams.start_date} &rarr; {searchParams.end_date}
            </span>
          )}

          {searchParams.guests && searchParams.guests > 1 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-300 text-gray-800 font-semibold">
              Guests: {searchParams.guests}+
            </span>
          )}

          {(filterParams.minPrice || filterParams.maxPrice) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-300 text-gray-800 font-semibold">
              Price: &#8377;{filterParams.minPrice || 0} &ndash; &#8377;{filterParams.maxPrice || 'Any'}
            </span>
          )}

          {filterParams.propertyType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-300 text-gray-800 font-semibold">
              Type: {filterParams.propertyType}
            </span>
          )}

          {filterParams.amenities.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-300 text-gray-800 font-semibold">
              Amenities: {filterParams.amenities.join(', ')}
            </span>
          )}

          {filterParams.minRating && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-300 text-gray-800 font-semibold">
              Rating: {filterParams.minRating}+
            </span>
          )}

          <button
            type="button"
            onClick={handleResetAll}
            className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}

      {/* 4. Listings Grid / Skeletons / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-square bg-gray-200 rounded-2xl w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600 font-medium">
            <span>Showing {listings.length} {listings.length === 1 ? 'home' : 'homes'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-gray-50 rounded-3xl border border-gray-200 p-8">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center">
            <SearchX className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No homes match your filters</h3>
          <p className="text-gray-500 max-w-sm text-sm">
            Try changing your price range, location, dates, or amenities to discover available stays.
          </p>
          <button
            onClick={handleResetAll}
            className="mt-2 px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Filters & Show All Homes</span>
          </button>
        </div>
      )}

      {/* 5. Filter Modal Popover */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filterParams}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* 6. Floating Airbnb Show Map / Show List Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowMap((prev) => !prev)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-gray-900 hover:bg-black text-white text-sm font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all border border-gray-700"
        >
          {showMap ? (
            <>
              <List className="w-4 h-4 text-[#FF385C]" />
              <span>Show list</span>
            </>
          ) : (
            <>
              <MapIcon className="w-4 h-4 text-[#FF385C]" />
              <span>Show map</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
