'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Quest, Event } from '@/types';
import { Button, Card, CardHeader, CardTitle, CardContent, Loading } from '@/components/ui';

export default function HomePage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questsData, eventsData] = await Promise.all([api.getActiveQuests(), api.getUpcomingEvents()]);
        setQuests(questsData.slice(0, 4));
        setEvents(eventsData.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Connect with Your Favorite Creators</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Complete quests, attend events, and collect exclusive NFTs on the ultimate fan economy platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quests">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Explore Quests
              </Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Upcoming Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Active Quests Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Active Quests</h2>
            <Link href="/quests" className="text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {quests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          ) : (
            <Card variant="bordered" className="text-center py-12">
              <p className="text-gray-500">No active quests at the moment</p>
            </Card>
          )}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
            <Link href="/events" className="text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card variant="bordered" className="text-center py-12">
              <p className="text-gray-500">No upcoming events at the moment</p>
            </Card>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">Why Join LFF?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="trophy"
              title="Complete Quests"
              description="Earn rewards by completing fan activities and challenges from your favorite creators."
            />
            <FeatureCard
              icon="calendar"
              title="Attend Events"
              description="Get exclusive access to events and collect proof of attendance as NFTs."
            />
            <FeatureCard
              icon="lock"
              title="Exclusive Content"
              description="Unlock token-gated content using your collected NFTs."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const typeColors: Record<string, string> = {
    SOCIAL_SHARE: 'bg-blue-100 text-blue-700',
    CONTENT_VIEW: 'bg-green-100 text-green-700',
    QUIZ: 'bg-purple-100 text-purple-700',
    SURVEY: 'bg-yellow-100 text-yellow-700',
    CUSTOM: 'bg-gray-100 text-gray-700',
  };

  return (
    <Link href={`/quests/${quest.id}`}>
      <Card variant="bordered" className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${typeColors[quest.type]}`}>
            {quest.type.replace('_', ' ')}
          </span>
          <CardTitle className="mt-2 line-clamp-2">{quest.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">{quest.description}</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{quest.creator?.displayName || 'Creator'}</span>
            <span className="font-medium text-blue-600">
              +{quest.rewardAmount} {quest.rewardType}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EventCard({ event }: { event: Event }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Link href={`/events/${event.id}`}>
      <Card variant="bordered" className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>{formatDate(event.startDate)}</span>
            {event.location && (
              <>
                <span>-</span>
                <span>{event.location}</span>
              </>
            )}
          </div>
          <CardTitle className="line-clamp-2">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{event.creator?.displayName || 'Creator'}</span>
            {event.maxAttendees && (
              <span className="text-gray-500">{event._count?.attendances || 0}/{event.maxAttendees}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  const icons: Record<string, React.ReactNode> = {
    trophy: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    calendar: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    lock: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
  };

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
        {icons[icon]}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
