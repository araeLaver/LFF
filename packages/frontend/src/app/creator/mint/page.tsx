'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Loading,
} from '@/components/ui';

type MintType = 'EVENT_ATTENDANCE' | 'QUEST_COMPLETION' | 'CUSTOM';

interface MintHistory {
  id: string;
  tokenId: string;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  tokenType: string | null;
  referenceId: string | null;
  transactionHash: string | null;
  recipientAddress: string;
  recipientNickname: string | null;
  mintedAt: string;
}

export default function CreatorMintPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [mintType, setMintType] = useState<MintType>('CUSTOM');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ tokenId: string; txHash: string } | null>(null);
  const [mintHistory, setMintHistory] = useState<MintHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isAuthenticated || (user?.role !== 'CREATOR' && user?.role !== 'ADMIN')) return;
      try {
        const history = await api.getMintingHistory();
        setMintHistory(history);
      } catch (err) {
        console.error('Failed to fetch minting history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [isAuthenticated, user, success]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'CREATOR' && user?.role !== 'ADMIN')) {
    router.push('/');
    return null;
  }

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsMinting(true);

    try {
      const result = await api.mintNFT({
        recipientAddress,
        name,
        description,
        imageUrl: imageUrl || undefined,
        tokenType: mintType,
        referenceId: referenceId || undefined,
      });

      setSuccess({
        tokenId: result.tokenId,
        txHash: result.transactionHash,
      });

      // Reset form
      setRecipientAddress('');
      setName('');
      setDescription('');
      setImageUrl('');
      setReferenceId('');
    } catch (err: any) {
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/creator" className="hover:text-blue-600">
          Dashboard
        </Link>
        <span>/</span>
        <span>Mint SBT</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mint Soulbound Token</h1>
        <p className="text-gray-600 mt-1">
          Mint SBTs directly to fans for special achievements
        </p>
      </div>

      <Card variant="bordered">
        <CardHeader>
          <CardTitle>New SBT</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMint} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">SBT Minted Successfully!</span>
                </div>
                <p className="text-sm text-green-600">Token ID: {success.tokenId}</p>
                <p className="text-sm text-green-600 break-all">Tx: {success.txHash}</p>
              </div>
            )}

            {/* Token Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'CUSTOM', label: 'Custom', icon: '🎁' },
                  { value: 'EVENT_ATTENDANCE', label: 'Event', icon: '📅' },
                  { value: 'QUEST_COMPLETION', label: 'Quest', icon: '🏆' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMintType(type.value as MintType)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      mintType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <p className="text-sm font-medium mt-1">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Wallet Address *
              </label>
              <Input
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                The wallet address to receive the SBT
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., VIP Fan Badge"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this token..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional image for the token metadata
              </p>
            </div>

            {/* Reference ID */}
            {mintType !== 'CUSTOM' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {mintType === 'EVENT_ATTENDANCE' ? 'Event ID' : 'Quest ID'}
                </label>
                <Input
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="Enter ID..."
                />
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isMinting}
                disabled={isMinting || !recipientAddress || !name}
              >
                {isMinting ? 'Minting...' : 'Mint SBT'}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                This will mint a non-transferable Soulbound Token on the blockchain
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Minting History */}
      <Card variant="bordered" className="mt-8">
        <CardHeader>
          <CardTitle>Minting History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <Loading text="Loading history..." />
          ) : mintHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No minting history yet</p>
          ) : (
            <div className="space-y-4">
              {mintHistory.map((mint) => (
                <div
                  key={mint.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {mint.name || 'Unnamed Token'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Token ID: {mint.tokenId}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        mint.tokenType === 'EVENT_ATTENDANCE'
                          ? 'bg-blue-100 text-blue-700'
                          : mint.tokenType === 'QUEST_COMPLETION'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {mint.tokenType || 'CUSTOM'}
                    </span>
                  </div>
                  {mint.description && (
                    <p className="text-sm text-gray-600 mb-2">{mint.description}</p>
                  )}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      Recipient:{' '}
                      <span className="font-mono">
                        {mint.recipientNickname || `${mint.recipientAddress.slice(0, 6)}...${mint.recipientAddress.slice(-4)}`}
                      </span>
                    </p>
                    {mint.transactionHash && (
                      <p className="truncate">
                        Tx: <span className="font-mono">{mint.transactionHash}</span>
                      </p>
                    )}
                    <p>
                      Minted: {new Date(mint.mintedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
