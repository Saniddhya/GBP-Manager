import React from 'react';

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">AI-Powered GBP Post Manager</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl">
        The ultimate tool for local businesses to generate, manage, and publish high-converting Google Business Profile posts using AI.
      </p>
      <div className="flex gap-4">
        <a href="/register" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Get Started
        </a>
        <a href="/login" className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
          Sign In
        </a>
      </div>
    </div>
  );
}
