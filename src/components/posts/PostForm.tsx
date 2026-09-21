'use client';
import React, { useState } from 'react';
import { MOCK_LOCATIONS } from '@/lib/mock-locations';
import PostPreview from '@/components/posts/PostPreview';
import { Loader2, Sparkles, Save, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PostFormInitialData } from '@/types/post';

export default function PostForm({ initialData }: { initialData?: PostFormInitialData }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    locationId: initialData?.locationId || '',
    businessName: initialData?.businessName || '',
    locationCity: initialData?.locationCity || '',
    topic: initialData?.topic || '',
    postType: initialData?.postType || 'UPDATE',
    tone: initialData?.tone || 'PROFESSIONAL',
    language: initialData?.language || 'English',
    cta: initialData?.cta || 'LEARN_MORE',
    content: initialData?.content || '',
    status: initialData?.status || 'DRAFT',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationChange = (id: string) => {
    const location = MOCK_LOCATIONS.find(l => l.id === id);
    if (location) {
      setFormData(prev => ({
        ...prev,
        locationId: id,
        businessName: location.businessName,
        locationCity: location.city,
      }));
    }
  };

  const generateAIContent = async () => {
    if (formData.topic.length < 10) {
      setError('Topic must be at least 10 characters before generating.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();
      setFormData(prev => ({ ...prev, content: data.content }));
    } catch {
      setError("We couldn't generate content right now. You can write or edit the post manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  const savePost = async (status: 'DRAFT' | 'PUBLISHED') => {
    setIsSaving(true);
    setError(null);
    try {
      const url = initialData
        ? `/api/posts/${initialData._id}`
        : '/api/posts';
      const method = initialData ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status }),
      });

      if (!res.ok) {
        // Surface the API's validation message (e.g. "Topic must be at least 10 characters")
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to save post');
      }

      router.push('/posts');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Side */}
      <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {initialData ? 'Edit GBP Post' : 'Create GBP Post'}
        </h2>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <select
              value={formData.locationId}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select a location</option>
              {MOCK_LOCATIONS.map(l => (
                <option key={l.id} value={l.id}>{l.businessName} ({l.city})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Language</label>
            <input
              type="text"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Topic</label>
          <textarea
            rows={2}
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="e.g. Summer Sale on Organic Coffee"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Post Type</label>
            <select
              value={formData.postType}
              onChange={(e) => setFormData({ ...formData, postType: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="UPDATE">Update</option>
              <option value="OFFER">Offer</option>
              <option value="EVENT">Event</option>
              <option value="PRODUCT">Product</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tone</label>
            <select
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="PROFESSIONAL">Professional</option>
              <option value="FRIENDLY">Friendly</option>
              <option value="URGENT">Urgent</option>
              <option value="CONCISE">Concise</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">CTA</label>
            <select
              value={formData.cta}
              onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="BOOK">Book Now</option>
              <option value="CALL">Call Now</option>
              <option value="LEARN_MORE">Learn More</option>
              <option value="ORDER">Order Now</option>
              <option value="SIGN_UP">Sign Up</option>
              <option value="GET_OFFER">Get Offer</option>
              <option value="NONE">None</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Content</label>
            <button
              onClick={generateAIContent}
              disabled={isGenerating || formData.topic.length < 10}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
          <textarea
            rows={6}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => savePost('DRAFT')}
            disabled={isSaving || !formData.content}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => savePost('PUBLISHED')}
            disabled={isSaving || !formData.content}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            Publish Post
          </button>
        </div>
      </div>

      {/* Preview Side */}
      <div className="flex flex-col items-center justify-start pt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Live Preview</h2>
        <PostPreview data={formData} />
      </div>
    </div>
  );
}
