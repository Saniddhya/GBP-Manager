import React from 'react';

interface PostPreviewProps {
  data: {
    businessName: string;
    locationCity: string;
    content: string;
    cta: string;
    postType: string;
    status: string;
  };
}

export default function PostPreview({ data }: PostPreviewProps) {
  const { businessName, locationCity, content, cta, postType, status } = data;

  const ctaLabels: Record<string, string> = {
    BOOK: 'Book Now',
    CALL: 'Call Now',
    LEARN_MORE: 'Learn More',
    ORDER: 'Order Now',
    SIGN_UP: 'Sign Up',
    GET_OFFER: 'Get Offer',
    NONE: '',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-md mx-auto">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-gray-900">{businessName}</h4>
          <p className="text-xs text-gray-500">{locationCity}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
            {postType}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {status}
          </span>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {content || 'Your post content will appear here...'}
        </p>
      </div>

      {/* CTA Button */}
      {cta !== 'NONE' && (
        <div className="p-4 pt-0">
          <button className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            {ctaLabels[cta] || cta}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
        <p className="text-[10px] text-gray-400">Google Business Profile Preview</p>
      </div>
    </div>
  );
}
