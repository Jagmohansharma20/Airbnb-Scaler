'use client';

import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, X, RotateCcw } from 'lucide-react';

interface SearchBarProps {
  onSearch: (params: {
    location?: string;
    start_date?: string;
    end_date?: string;
    guests?: number;
  }) => void;
  initialValues?: {
    location?: string;
    start_date?: string;
    end_date?: string;
    guests?: number;
  };
}

export function SearchBar({ onSearch, initialValues }: SearchBarProps) {
  const [location, setLocation] = useState(initialValues?.location || '');
  const [startDate, setStartDate] = useState(initialValues?.start_date || '');
  const [endDate, setEndDate] = useState(initialValues?.end_date || '');
  const [guests, setGuests] = useState<number>(initialValues?.guests || 1);
  const [activeTab, setActiveTab] = useState<'where' | 'when' | 'who' | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch({
      location: location.trim() || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      guests: guests > 1 ? guests : undefined,
    });
  };

  const handleClear = () => {
    setLocation('');
    setStartDate('');
    setEndDate('');
    setGuests(1);
    onSearch({});
  };

  const hasFilters = Boolean(location || startDate || endDate || guests > 1);

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-3xl sm:rounded-full border border-gray-300 shadow-lg hover:shadow-xl transition-all duration-200 p-2 flex flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x divide-gray-200"
      >
        {/* Where: Location */}
        <div className="w-full sm:w-1/3 px-5 py-2.5 flex flex-col justify-center cursor-pointer hover:bg-gray-50 rounded-full transition-colors group">
          <label className="text-xs font-bold text-gray-800 tracking-wider flex items-center gap-1.5 cursor-pointer">
            <MapPin className="w-3.5 h-3.5 text-[#FF385C]" />
            Where
          </label>
          <input
            type="text"
            placeholder="Search destinations (e.g. Delhi, Goa)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none font-medium focus:ring-0 p-0 truncate"
          />
        </div>

        {/* When: Check-in / Check-out Date Range */}
        <div className="w-full sm:w-2/5 px-5 py-2.5 flex flex-col justify-center cursor-pointer hover:bg-gray-50 rounded-full transition-colors group">
          <label className="text-xs font-bold text-gray-800 tracking-wider flex items-center gap-1.5 cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-[#FF385C]" />
            When
          </label>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value >= endDate) {
                  setEndDate('');
                }
              }}
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-gray-800 focus:ring-0 p-0 cursor-pointer w-32"
              title="Check-in Date"
            />
            <span className="text-gray-400 font-light">&rarr;</span>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-gray-800 focus:ring-0 p-0 cursor-pointer w-32"
              title="Check-out Date"
            />
          </div>
        </div>

        {/* Who: Guests selector & Search Button */}
        <div className="w-full sm:w-1/3 px-5 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-50 rounded-full transition-colors">
          <div className="flex flex-col justify-center flex-1">
            <label className="text-xs font-bold text-gray-800 tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#FF385C]" />
              Who
            </label>
            <div className="flex items-center gap-2">
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="bg-transparent text-sm font-medium text-gray-800 border-none outline-none focus:ring-0 p-0 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                type="button"
                onClick={handleClear}
                title="Reset filters"
                className="p-2.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#FF385C] hover:bg-[#E00B41] text-white px-5 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-200 group active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
