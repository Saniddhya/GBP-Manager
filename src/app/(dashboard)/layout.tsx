'use client';
import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  MapPin,
  FileText,
  PlusCircle,
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarItem = ({ href, icon, label, active }: SidebarItemProps) => (
  <Link
    href={href}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <PlusCircle className="w-6 h-6" />
            GBP Manager
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem
            href="/dashboard"
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <SidebarItem
            href="/locations"
            icon={<MapPin className="w-5 h-5" />}
            label="Locations"
          />
          <SidebarItem
            href="/posts"
            icon={<FileText className="w-5 h-5" />}
            label="Posts"
          />

          <div className="pt-4 mt-4 border-t border-gray-100">
            <Link
              href="/posts/new"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusCircle className="w-5 h-5" />
              Create GBP Post
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 text-gray-600">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium truncate">User Account</span>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
