'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostPreview from '@/components/posts/PostPreview';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { PostRecord } from '@/types/post';

export default function ViewPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<PostRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${params.id}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
          } else {
            throw new Error('Post not found');
          }
          return;
        }
        const data = await res.json();
        setPost(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Post not found');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h2>
        <p className="text-gray-600 mb-6">{error || 'The requested post could not be found.'}</p>
        <Link
          href="/posts"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Posts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/posts"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Posts
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Details Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.topic}</h1>
            <p className="text-gray-600">{post.businessName} • {post.locationCity}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Post Type</p>
              <p className="font-semibold text-gray-900">{post.postType}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Tone</p>
              <p className="font-semibold text-gray-900">{post.tone}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Language</p>
              <p className="font-semibold text-gray-900">{post.language}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
              <p className={`font-semibold ${post.status === 'PUBLISHED' ? 'text-green-600' : 'text-amber-600'}`}>
                {post.status}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-2 uppercase">Content</p>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          <Link
            href={`/posts/${post._id}/edit`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Edit Post
          </Link>
        </div>

        {/* Preview Section */}
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-900 mb-6">GBP Live Preview</h3>
          <PostPreview data={post} />
        </div>
      </div>
    </div>
  );
}
