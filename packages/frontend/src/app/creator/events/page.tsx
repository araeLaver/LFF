'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Event, CreateEventDto } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Loading } from '@/components/ui';

export default function CreatorEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('new') === 'true');

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
    const fetchEvents = async () => {
      if (!isAuthenticated || (user?.role !== 'CREATOR' && user?.role !== 'ADMIN')) return;

      setIsLoading(true);
      try {
        const data = await api.getMyEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [isAuthenticated, user]);

  const handleEventCreated = (event: Event) => {
    setEvents([event, ...events]);
    setShowCreateForm(false);
  };

  if (authLoading || !isAuthenticated || (user?.role !== 'CREATOR' && user?.role !== 'ADMIN')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/creator" className="text-gray-600 hover:text-gray-900 text-sm mb-2 inline-block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create Event'}
        </Button>
      </div>

      {showCreateForm && (
        <Card variant="bordered" className="mb-8">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateEventForm onSuccess={handleEventCreated} onCancel={() => setShowCreateForm(false)} />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loading text="Loading events..." />
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-gray-500 mb-4">No events yet</p>
          <Button onClick={() => setShowCreateForm(true)}>Create Your First Event</Button>
        </Card>
      )}
    </div>
  );
}

function CreateEventForm({ onSuccess, onCancel }: { onSuccess: (event: Event) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data: CreateEventDto = {
        title,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };

      if (location) {
        data.location = location;
      }
      if (maxAttendees) {
        data.maxAttendees = parseInt(maxAttendees);
      }

      const event = await api.createEvent(data);
      onSuccess(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <Input label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date & Time"
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          label="End Date & Time"
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </div>

      <Input
        label="Max Attendees (optional)"
        type="number"
        value={maxAttendees}
        onChange={(e) => setMaxAttendees(e.target.value)}
      />

      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          Create Event
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EventRow({ event }: { event: Event }) {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCodes, setQrCodes] = useState<string[]>([]);
  const [qrCount, setQrCount] = useState('10');
  const [showQRModal, setShowQRModal] = useState(false);

  const statusColors: Record<string, string> = {
    UPCOMING: 'bg-blue-100 text-blue-700',
    ONGOING: 'bg-green-100 text-green-700',
    ENDED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    try {
      const result = await api.generateQRCode(event.id, parseInt(qrCount));
      setQrCodes(result.codes);
      setShowQRModal(true);
    } catch (error) {
      console.error('Failed to generate QR codes:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Card variant="bordered">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[event.status]}`}>
                  {event.status}
                </span>
              </div>
              <h3 className="font-medium text-lg">{event.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-1">{event.description}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>{formatDate(event.startDate)}</span>
                {event.location && <span>{event.location}</span>}
                <span>
                  {event._count?.attendances || 0}
                  {event.maxAttendees && `/${event.maxAttendees}`} attendees
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {(event.status === 'UPCOMING' || event.status === 'ONGOING') && (
                <Button variant="outline" size="sm" onClick={() => setShowQRModal(true)}>
                  QR Codes
                </Button>
              )}
              <Link href={`/events/${event.id}`}>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card variant="elevated" className="w-full max-w-md max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>QR Codes for {event.title}</CardTitle>
                <button onClick={() => setShowQRModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={qrCount}
                  onChange={(e) => setQrCount(e.target.value)}
                  placeholder="Count"
                  className="w-24"
                />
                <Button onClick={handleGenerateQR} isLoading={isGeneratingQR}>
                  Generate New QR Codes
                </Button>
              </div>

              {qrCodes.length > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Generated {qrCodes.length} QR codes:</p>
                  <div className="space-y-1 max-h-60 overflow-auto">
                    {qrCodes.map((code, index) => (
                      <div key={code} className="flex items-center gap-2 text-sm font-mono bg-white p-2 rounded">
                        <span className="text-gray-400">{index + 1}.</span>
                        <span className="flex-1 break-all">{code}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(code)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Share these codes with attendees at your event. Each code can only be used once.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
