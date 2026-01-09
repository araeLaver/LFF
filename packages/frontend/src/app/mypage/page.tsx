'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletLink } from '@/hooks';
import { useAccount } from 'wagmi';
import api from '@/lib/api';
import { NFT, QuestSubmission, Event } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Loading } from '@/components/ui';
import { ConnectWallet } from '@/components/wallet';
import { NFTCard, NFTDetailModal } from '@/components/nft';

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
  const [avatarUrl, setAvatarUrl] = useState('');
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
      setAvatarUrl(user.profile?.avatarUrl || '');
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
      await api.updateProfile({ nickname, bio, avatarUrl: avatarUrl || undefined });
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
        {user?.profile?.avatarUrl ? (
          <img
            src={user.profile.avatarUrl}
            alt={user.profile.nickname || 'Profile'}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.profile?.nickname?.charAt(0) || 'U'}
          </div>
        )}
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
              avatarUrl={avatarUrl}
              setAvatarUrl={setAvatarUrl}
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
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);

  const eventTokens = nfts.filter((nft) => nft.tokenType === 'EVENT_ATTENDANCE');
  const questTokens = nfts.filter((nft) => nft.tokenType === 'QUEST_COMPLETION');
  const otherTokens = nfts.filter((nft) => !nft.tokenType);

  if (nfts.length === 0) {
    return (
      <Card variant="bordered" className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No NFTs Yet</h3>
          <p className="text-gray-500 mb-6">Complete quests and attend events to earn Soulbound Tokens!</p>
          <div className="flex gap-3 justify-center">
            <Link href="/quests">
              <Button variant="outline" size="sm">Browse Quests</Button>
            </Link>
            <Link href="/events">
              <Button size="sm">View Events</Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Events</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{eventTokens.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Quests</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{questTokens.length}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{nfts.length}</p>
        </div>
      </div>

      {/* Event Tokens */}
      {eventTokens.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Event Attendance ({eventTokens.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {eventTokens.map((nft) => (
              <NFTCard key={nft.id} nft={nft} onClick={() => setSelectedNft(nft)} />
            ))}
          </div>
        </div>
      )}

      {/* Quest Tokens */}
      {questTokens.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Quest Completion ({questTokens.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {questTokens.map((nft) => (
              <NFTCard key={nft.id} nft={nft} onClick={() => setSelectedNft(nft)} />
            ))}
          </div>
        </div>
      )}

      {/* Other Tokens */}
      {otherTokens.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            Other Tokens ({otherTokens.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherTokens.map((nft) => (
              <NFTCard key={nft.id} nft={nft} onClick={() => setSelectedNft(nft)} />
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedNft && (
        <NFTDetailModal
          nft={selectedNft}
          isOpen={!!selectedNft}
          onClose={() => setSelectedNft(null)}
        />
      )}
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
  avatarUrl: string;
  setAvatarUrl: (value: string) => void;
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
  avatarUrl,
  setAvatarUrl,
  isSaving,
  saveError,
  onSave,
}: ProfileTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const result = await api.uploadImage(file, 'profiles');
      setAvatarUrl(result.url);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };
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
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {nickname?.charAt(0) || 'U'}
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAvatarUrl('')}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
            </div>

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

        {/* Wallet Section */}
        <WalletSection />
      </CardContent>
    </Card>
  );
}

function WalletSection() {
  const { address, isConnected } = useAccount();
  const {
    linkedWallet,
    isWalletLinked,
    isLinking,
    isUnlinking,
    isLoading,
    error,
    linkWallet,
    unlinkWallet,
  } = useWalletLink();

  if (isLoading) {
    return (
      <div className="pt-4 border-t">
        <label className="block text-sm font-medium text-gray-700 mb-2">Wallet</label>
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading wallet info...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t">
      <label className="block text-sm font-medium text-gray-700 mb-3">Wallet Connection</label>

      {/* Connected Wallet Display */}
      {isConnected && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Connected Wallet</p>
              <p className="font-mono text-sm break-all">{address}</p>
            </div>
            <ConnectWallet showBalance={false} chainStatus="icon" accountStatus="avatar" />
          </div>
        </div>
      )}

      {/* Not Connected */}
      {!isConnected && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mb-3">
            Connect your wallet to link it to your account and access NFT-gated content.
          </p>
          <ConnectWallet />
        </div>
      )}

      {/* Linked Wallet Info */}
      {linkedWallet && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">Wallet Linked</span>
          </div>
          <p className="font-mono text-xs break-all text-green-800">{linkedWallet.address}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Link/Unlink Actions */}
      <div className="flex gap-2">
        {!linkedWallet && isConnected && (
          <Button
            onClick={linkWallet}
            isLoading={isLinking}
            disabled={isLinking}
            size="sm"
          >
            Link Wallet to Account
          </Button>
        )}

        {linkedWallet && !isWalletLinked && isConnected && (
          <div className="text-sm text-yellow-600 p-3 bg-yellow-50 rounded-lg">
            Your connected wallet ({address?.slice(0, 6)}...{address?.slice(-4)}) differs from your linked wallet.
          </div>
        )}

        {linkedWallet && (
          <Button
            onClick={unlinkWallet}
            isLoading={isUnlinking}
            disabled={isUnlinking}
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50"
          >
            Unlink Wallet
          </Button>
        )}
      </div>
    </div>
  );
}
