'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Quest, Event } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button, Loading } from '@/components/ui';

export default function CreatorDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (user?.role !== 'CREATOR' && user?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || (user?.role !== 'CREATOR' && user?.role !== 'ADMIN')) return;

      setIsLoading(true);
      try {
        const [questsData, eventsData] = await Promise.all([api.getMyQuests(), api.getMyEvents()]);
        setQuests(questsData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, user]);

  if (authLoading || !isAuthenticated || (user?.role !== 'CREATOR' && user?.role !== 'ADMIN')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  const stats = [
    { label: 'Total Quests', value: quests.length, href: '/creator/quests' },
    { label: 'Active Quests', value: quests.filter((q) => q.status === 'ACTIVE').length, href: '/creator/quests' },
    { label: 'Total Events', value: events.length, href: '/creator/events' },
    { label: 'Upcoming Events', value: events.filter((e) => e.status === 'UPCOMING').length, href: '/creator/events' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your quests, events, and content</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card variant="bordered" className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Quests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Create and manage quests for your fans</p>
            <div className="flex gap-2">
              <Link href="/creator/quests">
                <Button variant="outline">View All</Button>
              </Link>
              <Link href="/creator/quests?new=true">
                <Button>Create Quest</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Create and manage events with QR check-in</p>
            <div className="flex gap-2">
              <Link href="/creator/events">
                <Button variant="outline">View All</Button>
              </Link>
              <Link href="/creator/events?new=true">
                <Button>Create Event</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Quests */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Quests</CardTitle>
              <Link href="/creator/quests" className="text-blue-600 text-sm hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading text="Loading..." />
            ) : quests.length > 0 ? (
              <div className="space-y-3">
                {quests.slice(0, 5).map((quest) => (
                  <div key={quest.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{quest.title}</p>
                      <p className="text-sm text-gray-500">{quest._count?.submissions || 0} submissions</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        quest.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {quest.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No quests yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Events</CardTitle>
              <Link href="/creator/events" className="text-blue-600 text-sm hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading text="Loading..." />
            ) : events.length > 0 ? (
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        event.status === 'UPCOMING'
                          ? 'bg-blue-100 text-blue-700'
                          : event.status === 'ONGOING'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No events yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
