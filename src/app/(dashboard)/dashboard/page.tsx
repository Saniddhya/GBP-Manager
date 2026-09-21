'use client';
import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  PlusCircle,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

interface Metrics {
  totalLocations: number;
  totalPosts: number;
  draftPosts: number;
  publishedPosts: number;
}

interface RecentPost {
  _id: string;
  businessName: string;
  topic: string;
  status: 'DRAFT' | 'PUBLISHED';
  updatedAt: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<{ metrics: Metrics; recentPosts: RecentPost[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Failed to fetch dashboard data', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <TrendingUp className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No data available</h2>
        <p className="text-gray-600 mb-6">Start creating your first GBP posts to see metrics here.</p>
        <Link
          href="/posts/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Create GBP Post
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here is what&apos;s happening with your posts.</p>
        </div>
        <Link
          href="/posts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Create Post
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Locations"
          value={data.metrics.totalLocations}
          icon={<MapPin className="w-5 h-5" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          label="Total Posts"
          value={data.metrics.totalPosts}
          icon={<FileText className="w-5 h-5" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <MetricCard
          label="Drafts"
          value={data.metrics.draftPosts}
          icon={<Clock className="w-5 h-5" />}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <MetricCard
          label="Published"
          value={data.metrics.publishedPosts}
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      {/* Recent Posts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Posts</h2>
          <Link href="/posts" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Business</th>
                <th className="px-6 py-3">Topic</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Updated</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.recentPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No recent posts found.
                  </td>
                </tr>
              ) : (
                data.recentPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{post.businessName}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{post.topic}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/posts/${post._id}/edit`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function MetricCard({ label, value, icon, color, bgColor }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${bgColor} ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="h-12 bg-gray-200 rounded-lg w-1/3 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-200 h-24 rounded-xl" />
        ))}
      </div>
      <div className="bg-gray-200 h-64 rounded-xl" />
    </div>
  );
}

