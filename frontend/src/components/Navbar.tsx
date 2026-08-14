'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Menu, 
  User as UserIcon, 
  Heart, 
  Luggage, 
  Home, 
  PlusCircle, 
  LogOut, 
  Compass, 
  LayoutDashboard,
  CalendarCheck2
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateTo = (path: string) => {
    setIsMenuOpen(false);
    router.push(path);
  };

  const isHost = Boolean(user?.is_host);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-shadow duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-full bg-[#FF385C] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.383c0 4.34-3.414 7.738-7.79 7.738-3.085 0-5.748-1.748-7.71-4.731-1.962 2.983-4.625 4.731-7.71 4.731-4.376 0-7.79-3.398-7.79-7.738 0-1.282.353-2.612 1.116-4.132l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C9.037 1.963 10.492 1 12.5 1h3.5zm0 2.222h-3.5c-1.312 0-2.234.613-3.23 2.394l-.533 1.025c-1.897 3.719-6.024 12.361-6.98 14.588-.636 1.267-.935 2.348-.935 3.393 0 3.256 2.445 5.516 5.568 5.516 2.593 0 4.966-1.79 6.84-5.074l.43-.772.44.772c1.874 3.284 4.247 5.074 6.84 5.074 3.123 0 5.568-2.26 5.568-5.516 0-1.045-.299-2.126-.935-3.393-.956-2.227-5.083-10.869-6.98-14.588l-.533-1.025c-.996-1.781-1.918-2.394-3.23-2.394zm0 13.334c2.43 0 4.4 1.97 4.4 4.4 0 2.43-1.97 4.4-4.4 4.4s-4.4-1.97-4.4-4.4c0-2.43 1.97-4.4 4.4-4.4zm0 2.222c-1.204 0-2.178.974-2.178 2.178s.974 2.178 2.178 2.178 2.178-.974 2.178-2.178-.974-2.178-2.178-2.178z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-[#FF385C] tracking-tight hidden sm:inline-block">
            airbnb
          </span>
        </div>

        {/* Center / Main Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* 1. All Homes */}
          <button
            onClick={() => router.push('/')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              pathname === '/'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Compass className="w-4 h-4 text-[#FF385C]" />
            <span>All Homes</span>
          </button>

          {user && (
            <>
              {/* 2. Wishlist */}
              <button
                onClick={() => router.push('/wishlist')}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
                  pathname === '/wishlist'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Heart className="w-4 h-4 text-[#FF385C]" />
                <span className="hidden md:inline">Wishlist</span>
              </button>

              {/* 3. My Trips (Section 10 & 11: Renamed from Bookings) */}
              <button
                onClick={() => router.push('/bookings')}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
                  pathname === '/bookings'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Luggage className="w-4 h-4 text-[#FF385C]" />
                <span className="hidden md:inline">My Trips</span>
              </button>

              {/* 4. Become a Host (if not host) OR Host Dashboard (if host) - Sections 6 & 7 */}
              {isHost ? (
                <button
                  onClick={() => router.push('/host')}
                  className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
                    pathname.startsWith('/host')
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#FF385C]" />
                  <span className="hidden sm:inline">Host Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push('/host/create')}
                  className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
                    pathname === '/host/create'
                      ? 'bg-gray-100 text-[#FF385C]'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-[#FF385C]" />
                  <span className="hidden sm:inline">Become a Host</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Right: User Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="User navigation menu"
            className="flex items-center gap-3 p-2 pl-3.5 border border-gray-300 rounded-full hover:shadow-md transition-shadow bg-white"
          >
            <Menu className="w-4 h-4 text-gray-600" />
            <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-inner">
              {user ? (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              ) : (
                <UserIcon className="w-4 h-4 text-gray-300" />
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {user ? (
                <>
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">Logged in as</p>
                      {isHost && (
                        <span className="text-[10px] bg-rose-50 text-[#FF385C] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                          HOST
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    {/* Host Specific Links (Section 7) */}
                    {isHost ? (
                      <>
                        <button
                          onClick={() => navigateTo('/host')}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 font-semibold transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#FF385C]" />
                          Host Dashboard
                        </button>
                        <button
                          onClick={() => navigateTo('/host/bookings')}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 font-semibold transition-colors"
                        >
                          <CalendarCheck2 className="w-4 h-4 text-gray-500" />
                          Host Bookings
                        </button>
                        <button
                          onClick={() => navigateTo('/host/create')}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 font-medium transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-gray-500" />
                          Create New Listing
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigateTo('/host/create')}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 font-semibold transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-[#FF385C]" />
                        Become a Host
                      </button>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Guest Links (Section 5: Rahul can use guest features) */}
                    <button
                      onClick={() => navigateTo('/bookings')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 font-medium transition-colors"
                    >
                      <Luggage className="w-4 h-4 text-gray-500" />
                      My Trips
                    </button>
                    <button
                      onClick={() => navigateTo('/wishlist')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 font-medium transition-colors"
                    >
                      <Heart className="w-4 h-4 text-gray-500" />
                      Wishlist
                    </button>
                  </div>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="py-1">
                  <button
                    onClick={() => navigateTo('/login')}
                    className="w-full text-left px-4 py-3 text-sm text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigateTo('/signup')}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
