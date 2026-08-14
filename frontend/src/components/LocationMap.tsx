'use client';

import React, { useEffect, useRef } from 'react';
import { Compass } from 'lucide-react';

export interface LocationPin {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const MAP_LOCATIONS: LocationPin[] = [
  { id: 'delhi', name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Punjab / Haryana', lat: 30.7333, lng: 76.7794 },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { id: 'manali', name: 'Manali', state: 'Himachal Pradesh', lat: 32.2432, lng: 77.1892 },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { id: 'goa', name: 'Goa', state: 'Goa', lat: 15.2993, lng: 74.1240 },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { id: 'bangalore', name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
];

interface LocationMapProps {
  selectedLocation?: string;
  onSelectLocation: (locationName: string) => void;
  onClearLocation?: () => void;
}

export function LocationMap({
  selectedLocation,
  onSelectLocation,
  onClearLocation,
}: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletLibRef = useRef<any>(null);
  const markerMapRef = useRef<{ [id: string]: any }>({});
  const onSelectLocationRef = useRef(onSelectLocation);

  // Keep callback ref updated to avoid map re-creation on handler change
  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  // 1. Initialize Map ONCE on component mount
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      // Prevent duplicate initialization on the same container
      if (mapInstanceRef.current) return;

      try {
        const L = (await import('leaflet')).default;
        leafletLibRef.current = L;

        if (!isMounted || !mapContainerRef.current) return;

        // Create Leaflet Map instance
        const map = L.map(mapContainerRef.current, {
          center: [22.5, 79.0],
          zoom: 5,
          minZoom: 4,
          maxZoom: 16,
          scrollWheelZoom: false,
        });

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;

        // Create markers for each predefined location
        const newMarkers: { [id: string]: any } = {};

        MAP_LOCATIONS.forEach((loc) => {
          const isSelected =
            selectedLocation &&
            selectedLocation.toLowerCase().includes(loc.name.toLowerCase());

          const icon = L.divIcon({
            className: 'custom-map-pin',
            html: createPinHtml(loc.name, Boolean(isSelected)),
            iconSize: [84, 32],
            iconAnchor: [42, 16],
          });

          const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);

          // Popup
          const popupDiv = document.createElement('div');
          popupDiv.className = 'text-center p-1 font-sans';
          popupDiv.innerHTML = `
            <div style="font-weight: 700; font-size: 13px; color: #111; margin-bottom: 2px;">${loc.name}</div>
            <div style="font-size: 11px; color: #666; margin-bottom: 8px;">${loc.state}</div>
            <button id="pop-btn-${loc.id}" style="
              background: #FF385C;
              color: white;
              border: none;
              border-radius: 9999px;
              padding: 5px 12px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              width: 100%;
            ">View Homes in ${loc.name}</button>
          `;

          marker.bindPopup(popupDiv);

          marker.on('popupopen', () => {
            const btn = document.getElementById(`pop-btn-${loc.id}`);
            if (btn) {
              btn.onclick = () => {
                onSelectLocationRef.current(loc.name);
              };
            }
          });

          marker.on('click', () => {
            onSelectLocationRef.current(loc.name);
          });

          newMarkers[loc.id] = marker;
        });

        markerMapRef.current = newMarkers;

        // If a location is already selected on mount, center on it
        if (selectedLocation) {
          const found = MAP_LOCATIONS.find((l) =>
            selectedLocation.toLowerCase().includes(l.name.toLowerCase())
          );
          if (found) {
            map.setView([found.lat, found.lng], 8);
          }
        }
      } catch (err) {
        console.error('Error initializing map:', err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore cleanup errors
        }
        mapInstanceRef.current = null;
        markerMapRef.current = {};
      }
    };
  }, []); // Run once on mount

  // 2. React to selectedLocation changes smoothly without re-creating map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L) return;

    // Update marker icons
    MAP_LOCATIONS.forEach((loc) => {
      const marker = markerMapRef.current[loc.id];
      if (marker) {
        const isSelected =
          selectedLocation &&
          selectedLocation.toLowerCase().includes(loc.name.toLowerCase());

        const icon = L.divIcon({
          className: 'custom-map-pin',
          html: createPinHtml(loc.name, Boolean(isSelected)),
          iconSize: [84, 32],
          iconAnchor: [42, 16],
        });

        marker.setIcon(icon);
      }
    });

    // Pan map to active selected location
    if (selectedLocation) {
      const found = MAP_LOCATIONS.find((l) =>
        selectedLocation.toLowerCase().includes(l.name.toLowerCase())
      );
      if (found) {
        try {
          map.flyTo([found.lat, found.lng], 8, { duration: 0.8 });
        } catch (e) {
          map.setView([found.lat, found.lng], 8);
        }
      }
    }
  }, [selectedLocation]);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#FF385C]" />
            Explore Destinations Across India
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Click any pin on the map to filter available stays by location
          </p>
        </div>

        {/* Location Quick Jump Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onClearLocation && selectedLocation && (
            <button
              type="button"
              onClick={onClearLocation}
              className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-[#FF385C] border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              &times; Reset Map Location
            </button>
          )}

          <span className="text-xs font-semibold text-gray-400 hidden lg:inline">Quick Jump:</span>
          {MAP_LOCATIONS.map((loc) => {
            const isSelected =
              selectedLocation &&
              selectedLocation.toLowerCase().includes(loc.name.toLowerCase());
            return (
              <button
                type="button"
                key={loc.id}
                onClick={() => onSelectLocation(loc.name)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm font-bold'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 z-10"
        style={{ minHeight: '280px' }}
      />
    </div>
  );
}

// Helper to generate clean SVG pin HTML
function createPinHtml(name: string, isSelected: boolean): string {
  const bg = isSelected ? '#FF385C' : '#222222';
  const scale = isSelected ? 'scale(1.15)' : 'scale(1)';
  return `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: ${bg};
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 11px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2px solid #ffffff;
      cursor: pointer;
      transform: ${scale};
      transition: transform 0.2s ease, background-color 0.2s ease;
      white-space: nowrap;
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span>${name}</span>
    </div>
  `;
}
