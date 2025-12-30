'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              LFF
            </Link>
            <p className="mt-3 text-gray-400 max-w-md">
              Connect with your favorite creators, complete quests, attend events, and collect exclusive NFTs on the
              fan economy platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/quests" className="text-gray-400 hover:text-white transition-colors">
                  Quests
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-400 hover:text-white transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/content" className="text-gray-400 hover:text-white transition-colors">
                  Gated Content
                </Link>
              </li>
              <li>
                <Link href="/creators" className="text-gray-400 hover:text-white transition-colors">
                  Creators
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm text-center">
            &copy; {new Date().getFullYear()} LFF. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
