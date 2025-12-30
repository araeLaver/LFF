'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Quest, QuestType, CreateQuestDto } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Loading } from '@/components/ui';

export default function CreatorQuestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
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
    const fetchQuests = async () => {
      if (!isAuthenticated || (user?.role !== 'CREATOR' && user?.role !== 'ADMIN')) return;

      setIsLoading(true);
      try {
        const data = await api.getMyQuests();
        setQuests(data);
      } catch (error) {
        console.error('Failed to fetch quests:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuests();
  }, [isAuthenticated, user]);

  const handleQuestCreated = (quest: Quest) => {
    setQuests([quest, ...quests]);
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Quests</h1>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create Quest'}
        </Button>
      </div>

      {showCreateForm && (
        <Card variant="bordered" className="mb-8">
          <CardHeader>
            <CardTitle>Create New Quest</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateQuestForm onSuccess={handleQuestCreated} onCancel={() => setShowCreateForm(false)} />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loading text="Loading quests..." />
        </div>
      ) : quests.length > 0 ? (
        <div className="space-y-4">
          {quests.map((quest) => (
            <QuestRow key={quest.id} quest={quest} />
          ))}
        </div>
      ) : (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-gray-500 mb-4">No quests yet</p>
          <Button onClick={() => setShowCreateForm(true)}>Create Your First Quest</Button>
        </Card>
      )}
    </div>
  );
}

function CreateQuestForm({ onSuccess, onCancel }: { onSuccess: (quest: Quest) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<QuestType>('CUSTOM');
  const [rewardType, setRewardType] = useState('POINTS');
  const [rewardAmount, setRewardAmount] = useState('100');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data: CreateQuestDto = {
        title,
        description,
        type,
        rewardType,
        rewardAmount: parseInt(rewardAmount),
        startDate: new Date(startDate).toISOString(),
      };

      if (maxParticipants) {
        data.maxParticipants = parseInt(maxParticipants);
      }
      if (endDate) {
        data.endDate = new Date(endDate).toISOString();
      }

      const quest = await api.createQuest(data);
      onSuccess(quest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const questTypes: { value: QuestType; label: string }[] = [
    { value: 'SOCIAL_SHARE', label: 'Social Share' },
    { value: 'CONTENT_VIEW', label: 'Content View' },
    { value: 'QUIZ', label: 'Quiz' },
    { value: 'SURVEY', label: 'Survey' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quest Type</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={type}
          onChange={(e) => setType(e.target.value as QuestType)}
        >
          {questTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Reward Type" value={rewardType} onChange={(e) => setRewardType(e.target.value)} required />
        <Input
          label="Reward Amount"
          type="number"
          value={rewardAmount}
          onChange={(e) => setRewardAmount(e.target.value)}
          required
        />
      </div>

      <Input
        label="Max Participants (optional)"
        type="number"
        value={maxParticipants}
        onChange={(e) => setMaxParticipants(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          label="End Date (optional)"
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          Create Quest
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function QuestRow({ quest }: { quest: Quest }) {
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  const typeColors: Record<string, string> = {
    SOCIAL_SHARE: 'bg-blue-50 text-blue-600',
    CONTENT_VIEW: 'bg-green-50 text-green-600',
    QUIZ: 'bg-purple-50 text-purple-600',
    SURVEY: 'bg-yellow-50 text-yellow-600',
    CUSTOM: 'bg-gray-50 text-gray-600',
  };

  return (
    <Card variant="bordered">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeColors[quest.type]}`}>
                {quest.type.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[quest.status]}`}>
                {quest.status}
              </span>
            </div>
            <h3 className="font-medium text-lg">{quest.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-1">{quest.description}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>{quest._count?.submissions || 0} submissions</span>
              <span>
                +{quest.rewardAmount} {quest.rewardType}
              </span>
            </div>
          </div>
          <Link href={`/quests/${quest.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
