'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

export default function LeaguesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-6">
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <Link
                    href="/dashboard"
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span>Dashboard</span>
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <Link
                    href="/dashboard/leagues"
                    className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Leagues
                  </Link>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
