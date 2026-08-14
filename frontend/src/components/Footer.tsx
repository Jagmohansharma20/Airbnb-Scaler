import React from 'react';
import { Globe, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20 text-gray-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} Airbnb Clone, Inc.</span>
          <span className="hidden sm:inline">&middot;</span>
          <span className="hover:underline cursor-pointer">Privacy</span>
          <span className="hidden sm:inline">&middot;</span>
          <span className="hover:underline cursor-pointer">Terms</span>
          <span className="hidden sm:inline">&middot;</span>
          <span className="hover:underline cursor-pointer">Sitemap</span>
          <span className="hidden sm:inline">&middot;</span>
          <span className="hover:underline cursor-pointer">Company Details</span>
        </div>

        <div className="flex items-center gap-6 font-medium text-gray-800">
          <div className="flex items-center gap-2 cursor-pointer hover:underline">
            <Globe className="w-4 h-4" />
            <span>English (IN)</span>
          </div>
          <div className="flex items-center gap-1 font-semibold cursor-pointer hover:underline">
            <span>&#8377; INR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
