'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Loading } from '@/components/ui';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await api.getEvent(params.id as string);
        setEvent(data);
      } catch (error) {
        console.error('Failed to fetch event:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [params.id]);

  const handleRedeemQR = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!qrCode.trim()) {
      setError('Please enter a QR code');
      return;
    }

    setIsRedeeming(true);
    setError('');
    setRedeemResult(null);

    try {
      const result = await api.redeemQRCode(qrCode.trim());
      setRedeemResult(result);
      if (result.success) {
        setQrCode('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem QR code');
    } finally {
      setIsRedeeming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading event..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h1>
        <Link href="/events">
          <Button variant="outline">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    UPCOMING: 'bg-blue-100 text-blue-700',
    ONGOING: 'bg-green-100 text-green-700',
    ENDED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/events" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>

      <Card variant="bordered" className="overflow-hidden">
        {/* Event Image */}
        {event.imageUrl && (
          <div className="relative h-64 w-full">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${statusColors[event.status]}`}>
              {event.status}
            </span>
          </div>
          <CardTitle className="text-2xl">{event.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Creator Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium">
              {event.creator?.displayName?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="font-medium">{event.creator?.displayName || 'Creator'}</p>
              <p className="text-sm text-gray-500">Event Host</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">Start</span>
              </div>
              <p className="text-gray-900">{formatDate(event.startDate)}</p>
              <p className="text-gray-600">{formatTime(event.startDate)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">End</span>
              </div>
              <p className="text-gray-900">{formatDate(event.endDate)}</p>
              <p className="text-gray-600">{formatTime(event.endDate)}</p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="font-medium">Location</span>
              </div>
              <p className="text-gray-900">{event.location}</p>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About this event</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Attendance */}
          {event.maxAttendees && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Attendance</p>
              <p className="text-xl font-bold">
                {event._count?.attendances || 0} / {event.maxAttendees}
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(((event._count?.attendances || 0) / event.maxAttendees) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* QR Code Redemption */}
          {(event.status === 'ONGOING' || event.status === 'UPCOMING') && (
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Check In with QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the QR code provided at the event to verify your attendance and receive a proof-of-attendance NFT.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter QR code"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleRedeemQR} isLoading={isRedeeming}>
                  Redeem
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
              )}

              {/* Success Message */}
              {redeemResult?.success && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
                  {redeemResult.message}
                </div>
              )}

              {/* Failure Message */}
              {redeemResult && !redeemResult.success && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-600 rounded-lg text-sm">
                  {redeemResult.message}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
