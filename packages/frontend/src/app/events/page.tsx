'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Event, EventStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Loading, Button } from '@/components/ui';

const EVENT_STATUSES: { value: EventStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Events' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'ENDED', label: 'Ended' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | 'ALL'>('ALL');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.getAllEvents();
        setEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedStatus === 'ALL') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter((e) => e.status === selectedStatus));
    }
  }, [selectedStatus, events]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading events..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Attend events and collect proof-of-attendance NFTs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {EVENT_STATUSES.map((status) => (
          <Button
            key={status.value}
            variant={selectedStatus === status.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(status.value)}
          >
            {status.label}
          </Button>
        ))}
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-gray-500">No events found</p>
        </Card>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const statusColors: Record<string, string> = {
    UPCOMING: 'bg-blue-100 text-blue-700',
    ONGOING: 'bg-green-100 text-green-700',
    ENDED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link href={`/events/${event.id}`}>
      <Card variant="bordered" className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        {/* Event Image */}
        {event.imageUrl ? (
          <div className="relative h-40 w-full">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColors[event.status]}`}>
                {event.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <CardHeader className="pb-2">
          {!event.imageUrl && (
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusColors[event.status]}`}>
                {event.status}
              </span>
            </div>
          )}
          <CardTitle className="line-clamp-2">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{formatDate(event.startDate)}</span>
              <span>{formatTime(event.startDate)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                {event.creator?.displayName?.charAt(0) || 'C'}
              </div>
              <span className="text-sm text-gray-600">{event.creator?.displayName || 'Creator'}</span>
            </div>
            {event.maxAttendees && (
              <span className="text-sm text-gray-500">
                {event._count?.attendances || 0}/{event.maxAttendees}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
