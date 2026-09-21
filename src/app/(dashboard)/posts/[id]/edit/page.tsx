'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostForm from '@/components/posts/PostForm';
import { Loader2 } from 'lucide-react';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
        } else {
          router.push('/posts');
        }
      } catch (e) {
        console.error('Failed to fetch post', e);
        router.push('/posts');
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

  if (!post) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Post</h1>
      <PostForm initialData={post} />
    </div>
  );
}
