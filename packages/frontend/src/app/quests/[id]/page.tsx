'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Quest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Loading } from '@/components/ui';

export default function QuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuest = async () => {
      try {
        const data = await api.getQuest(params.id as string);
        setQuest(data);
      } catch (error) {
        console.error('Failed to fetch quest:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuest();
  }, [params.id]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.submitQuest(params.id as string, {});
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading quest..." />
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Quest not found</h1>
        <Link href="/quests">
          <Button variant="outline">Back to Quests</Button>
        </Link>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    SOCIAL_SHARE: 'bg-blue-100 text-blue-700',
    CONTENT_VIEW: 'bg-green-100 text-green-700',
    QUIZ: 'bg-purple-100 text-purple-700',
    SURVEY: 'bg-yellow-100 text-yellow-700',
    CUSTOM: 'bg-gray-100 text-gray-700',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/quests" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Quests
      </Link>

      <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${typeColors[quest.type]}`}>
              {quest.type.replace('_', ' ')}
            </span>
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                quest.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {quest.status}
            </span>
          </div>
          <CardTitle className="text-2xl">{quest.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Creator Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium">
              {quest.creator?.displayName?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="font-medium">{quest.creator?.displayName || 'Creator'}</p>
              <p className="text-sm text-gray-500">{quest.creator?.description || 'Quest Creator'}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{quest.description}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Reward</p>
              <p className="text-xl font-bold text-blue-600">
                +{quest.rewardAmount} <span className="text-sm font-normal">{quest.rewardType}</span>
              </p>
            </div>
            {quest.maxParticipants && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Participants</p>
                <p className="text-xl font-bold">
                  {quest._count?.submissions || 0} / {quest.maxParticipants}
                </p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Started: {formatDate(quest.startDate)}</p>
            {quest.endDate && <p>Ends: {formatDate(quest.endDate)}</p>}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          {/* Success Message */}
          {submitted && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              Quest submitted successfully! Please wait for review.
            </div>
          )}
        </CardContent>

        <CardFooter>
          {!submitted && quest.status === 'ACTIVE' && (
            <Button className="w-full" size="lg" onClick={handleSubmit} isLoading={isSubmitting}>
              {isAuthenticated ? 'Complete Quest' : 'Login to Complete'}
            </Button>
          )}
          {submitted && (
            <Button className="w-full" size="lg" variant="secondary" disabled>
              Submitted
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
