import React from 'react';
import PostForm from '@/components/posts/PostForm';

export default function NewPostPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Post</h1>
      <PostForm />
    </div>
  );
}
