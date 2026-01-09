'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Loading } from '@/components/ui';

interface Stats {
  totalUsers: number;
  totalCreators: number;
  totalQuests: number;
  totalEvents: number;
  totalNfts: number;
  totalGatedContent: number;
  recentUsers: number;
  pendingSubmissions: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (user?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated || user?.role !== 'ADMIN') return;
      try {
        const data = await api.getAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [isAuthenticated, user]);

  if (authLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, color: 'blue' },
        { label: 'Total Creators', value: stats.totalCreators, color: 'purple' },
        { label: 'Total Quests', value: stats.totalQuests, color: 'green' },
        { label: 'Total Events', value: stats.totalEvents, color: 'orange' },
        { label: 'Total NFTs', value: stats.totalNfts, color: 'pink' },
        { label: 'Gated Content', value: stats.totalGatedContent, color: 'indigo' },
        { label: 'New Users (7d)', value: stats.recentUsers, color: 'cyan' },
        { label: 'Pending Reviews', value: stats.pendingSubmissions, color: 'red' },
      ]
    : [];

  const menuItems = [
    { label: 'User Management', href: '/admin/users', icon: '👥', desc: 'Manage users and roles' },
    { label: 'Quest Moderation', href: '/admin/quests', icon: '🏆', desc: 'Review and moderate quests' },
    { label: 'Event Moderation', href: '/admin/events', icon: '📅', desc: 'Review and moderate events' },
    { label: 'Content Moderation', href: '/admin/content', icon: '📦', desc: 'Review gated content' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and management</p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <Loading text="Loading stats..." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} variant="bordered">
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Management Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card variant="bordered" className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{item.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
