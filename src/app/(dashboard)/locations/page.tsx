import React from 'react';
import { MOCK_LOCATIONS } from '@/lib/mock-locations';
import { MapPin, Globe, Phone } from 'lucide-react';

export default function LocationsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Locations</h1>
        <p className="text-gray-600">Manage the locations linked to your Google Business Profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_LOCATIONS.map((location) => (
          <div
            key={location.id}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">{location.businessName}</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                {location.category}
              </span>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{location.address}, {location.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{location.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <a href={location.website} className="text-blue-600 hover:underline truncate">
                  {location.website}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
