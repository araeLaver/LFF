'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Quest, QuestType, QuestStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Loading, Button } from '@/components/ui';

const QUEST_TYPES: { value: QuestType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Types' },
  { value: 'SOCIAL_SHARE', label: 'Social Share' },
  { value: 'CONTENT_VIEW', label: 'Content View' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'SURVEY', label: 'Survey' },
  { value: 'CUSTOM', label: 'Custom' },
];

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [filteredQuests, setFilteredQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<QuestType | 'ALL'>('ALL');

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const data = await api.getActiveQuests();
        setQuests(data);
        setFilteredQuests(data);
      } catch (error) {
        console.error('Failed to fetch quests:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuests();
  }, []);

  useEffect(() => {
    if (selectedType === 'ALL') {
      setFilteredQuests(quests);
    } else {
      setFilteredQuests(quests.filter((q) => q.type === selectedType));
    }
  }, [selectedType, quests]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading quests..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quests</h1>
          <p className="text-gray-600 mt-1">Complete quests to earn rewards</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {QUEST_TYPES.map((type) => (
          <Button
            key={type.value}
            variant={selectedType === type.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type.value)}
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* Quest Grid */}
      {filteredQuests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      ) : (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-gray-500">No quests found</p>
        </Card>
      )}
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Link href={`/quests/${quest.id}`}>
      <Card variant="bordered" className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${typeColors[quest.type]}`}>
              {quest.type.replace('_', ' ')}
            </span>
            {quest.endDate && (
              <span className="text-xs text-gray-500">Ends {formatDate(quest.endDate)}</span>
            )}
          </div>
          <CardTitle className="line-clamp-2">{quest.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">{quest.description}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                {quest.creator?.displayName?.charAt(0) || 'C'}
              </div>
              <span className="text-sm text-gray-600">{quest.creator?.displayName || 'Creator'}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-blue-600">
                +{quest.rewardAmount}
              </span>
              <span className="text-sm text-gray-500 ml-1">{quest.rewardType}</span>
            </div>
          </div>
          {quest.maxParticipants && (
            <div className="mt-3 text-sm text-gray-500">
              {quest._count?.submissions || 0} / {quest.maxParticipants} participants
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
