'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { NFT, QuestSubmission, Event } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Loading } from '@/components/ui';

type TabType = 'nfts' | 'submissions' | 'attendances' | 'profile';

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('nfts');
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [submissions, setSubmissions] = useState<QuestSubmission[]>([]);
  const [attendances, setAttendances] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setNickname(user.profile?.nickname || '');
      setBio(user.profile?.bio || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      try {
        const [nftsData, submissionsData, attendancesData] = await Promise.all([
          api.getMyNfts(),
          api.getMySubmissions(),
          api.getMyAttendances(),
        ]);
        setNfts(nftsData);
        setSubmissions(submissionsData);
        setAttendances(attendancesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      await api.updateProfile({ nickname, bio });
      await refreshUser();
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'nfts', label: 'My NFTs', count: nfts.length },
    { id: 'submissions', label: 'Quest Submissions', count: submissions.length },
    { id: 'attendances', label: 'Event Attendances', count: attendances.length },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
          {user?.profile?.nickname?.charAt(0) || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.profile?.nickname || 'User'}</h1>
          <p className="text-gray-600">{user?.email}</p>
          {user?.role === 'CREATOR' && (
            <Link href="/creator" className="text-blue-600 text-sm hover:underline">
              Go to Creator Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loading text="Loading..." />
        </div>
      ) : (
        <>
          {activeTab === 'nfts' && <NFTsTab nfts={nfts} />}
          {activeTab === 'submissions' && <SubmissionsTab submissions={submissions} />}
          {activeTab === 'attendances' && <AttendancesTab attendances={attendances} />}
          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              nickname={nickname}
              setNickname={setNickname}
              bio={bio}
              setBio={setBio}
              isSaving={isSaving}
              saveError={saveError}
              onSave={handleSaveProfile}
            />
          )}
        </>
      )}
    </div>
  );
}

function NFTsTab({ nfts }: { nfts: NFT[] }) {
  if (nfts.length === 0) {
    return (
      <Card variant="bordered" className="text-center py-12">
        <p className="text-gray-500 mb-4">You don&apos;t have any NFTs yet</p>
        <p className="text-sm text-gray-400">Complete quests and attend events to earn NFTs</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {nfts.map((nft) => (
        <Card key={nft.id} variant="bordered" className="overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-4xl font-bold">NFT</span>
          </div>
          <CardContent className="p-3">
            <p className="font-medium text-sm truncate">Token #{nft.tokenId}</p>
            <p className="text-xs text-gray-500 truncate">{nft.contractAddress}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SubmissionsTab({ submissions }: { submissions: QuestSubmission[] }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  if (submissions.length === 0) {
    return (
      <Card variant="bordered" className="text-center py-12">
        <p className="text-gray-500 mb-4">No quest submissions yet</p>
        <Link href="/quests">
          <Button variant="outline">Browse Quests</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id} variant="bordered">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <Link href={`/quests/${submission.questId}`} className="font-medium hover:text-blue-600">
                  {submission.quest?.title || 'Quest'}
                </Link>
                <p className="text-sm text-gray-500">
                  Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[submission.status]}`}>
                {submission.status}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AttendancesTab({ attendances }: { attendances: Event[] }) {
  if (attendances.length === 0) {
    return (
      <Card variant="bordered" className="text-center py-12">
        <p className="text-gray-500 mb-4">No event attendances yet</p>
        <Link href="/events">
          <Button variant="outline">Browse Events</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {attendances.map((event) => (
        <Card key={event.id} variant="bordered">
          <CardContent className="p-4">
            <Link href={`/events/${event.id}`} className="font-medium hover:text-blue-600">
              {event.title}
            </Link>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{new Date(event.startDate).toLocaleDateString()}</span>
              {event.location && <span>{event.location}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ProfileTabProps {
  user: any;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  nickname: string;
  setNickname: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  isSaving: boolean;
  saveError: string;
  onSave: () => void;
}

function ProfileTab({
  user,
  isEditing,
  setIsEditing,
  nickname,
  setNickname,
  bio,
  setBio,
  isSaving,
  saveError,
  onSave,
}: ProfileTabProps) {
  return (
    <Card variant="bordered">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Profile Settings</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{saveError}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="text-gray-900">{user?.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <p className="text-gray-900">{user?.role}</p>
        </div>

        {isEditing ? (
          <>
            <Input label="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave} isLoading={isSaving}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
              <p className="text-gray-900">{user?.profile?.nickname || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <p className="text-gray-900">{user?.profile?.bio || '-'}</p>
            </div>
          </>
        )}

        {user?.wallet && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
            <p className="text-gray-900 font-mono text-sm break-all">{user.wallet.address}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
