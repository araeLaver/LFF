'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, Button, Loading } from '@/components/ui';

export default function AdminEventsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isAuthenticated || user?.role !== 'ADMIN') return;
      setIsLoading(true);
      try {
        const data = await api.getAdminEvents(page, 20);
        setEvents(data.events);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [isAuthenticated, user, page]);

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also delete all QR codes.')) {
      return;
    }
    try {
      await api.deleteAdminEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/admin" className="hover:text-blue-600">Admin</Link>
        <span>/</span>
        <span>Events</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Event Moderation</h1>

      <Card variant="bordered">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <Loading text="Loading events..." />
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No events found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Creator</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">QR Codes</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {event.imageUrl && (
                            <img src={event.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                          )}
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{event.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {event.creator?.user?.profile?.nickname || event.creator?.user?.email || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(event.eventDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {event._count?.qrcodes || 0} codes
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
