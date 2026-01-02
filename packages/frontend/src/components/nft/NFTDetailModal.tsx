'use client';

import { NFT } from '@/types';
import Link from 'next/link';

interface NFTDetailModalProps {
  nft: NFT;
  isOpen: boolean;
  onClose: () => void;
}

export function NFTDetailModal({ nft, isOpen, onClose }: NFTDetailModalProps) {
  if (!isOpen) return null;

  const isEventToken = nft.tokenType === 'EVENT_ATTENDANCE';
  const isQuestToken = nft.tokenType === 'QUEST_COMPLETION';

  const title = isEventToken
    ? nft.event?.title || 'Event Attendance'
    : isQuestToken
      ? nft.quest?.title || 'Quest Completion'
      : `Token #${nft.tokenId}`;

  const description = isEventToken
    ? nft.event?.description
    : nft.quest?.description;

  const creatorName = isEventToken
    ? nft.event?.creator?.displayName || nft.event?.creator?.user?.profile?.nickname
    : nft.quest?.creator?.displayName || nft.quest?.creator?.user?.profile?.nickname;

  const mintDate = nft.mintedAt
    ? new Date(nft.mintedAt).toLocaleString()
    : new Date(nft.createdAt).toLocaleString();

  const relatedLink = isEventToken
    ? nft.event?.id ? `/events/${nft.event.id}` : null
    : nft.quest?.id ? `/quests/${nft.quest.id}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image/Gradient Area */}
        <div
          className={`aspect-video relative ${
            isEventToken
              ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400'
              : isQuestToken
                ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400'
                : 'bg-gradient-to-br from-gray-400 to-gray-600'
          }`}
        >
          {/* Type Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                isEventToken
                  ? 'bg-purple-900/70 text-white'
                  : isQuestToken
                    ? 'bg-blue-900/70 text-white'
                    : 'bg-gray-900/70 text-white'
              }`}
            >
              {isEventToken ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Event Attendance
                </>
              ) : isQuestToken ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Quest Completion
                </>
              ) : (
                'Soulbound Token'
              )}
            </span>
          </div>

          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {isEventToken ? (
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : isQuestToken ? (
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              ) : (
                <span className="text-4xl font-bold text-white">NFT</span>
              )}
            </div>
          </div>

          {/* Token ID */}
          <div className="absolute bottom-4 left-4">
            <span className="text-white font-mono text-lg">
              #{nft.tokenId}
            </span>
          </div>

          {/* Soulbound Badge */}
          <div className="absolute bottom-4 right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-black/50 text-white backdrop-blur-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Soulbound
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>

          {creatorName && (
            <p className="text-gray-600 mb-4">
              by <span className="font-medium">{creatorName}</span>
            </p>
          )}

          {description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{description}</p>
          )}

          {/* Details */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Minted</span>
              <span className="text-gray-900 font-medium">{mintDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Token ID</span>
              <span className="text-gray-900 font-mono">{nft.tokenId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Contract</span>
              <a
                href={`https://amoy.polygonscan.com/address/${nft.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-mono text-xs truncate max-w-[180px]"
              >
                {nft.contractAddress}
              </a>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Network</span>
              <span className="text-gray-900">Polygon Amoy</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            {relatedLink && (
              <Link
                href={relatedLink}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-lg transition-colors"
              >
                View {isEventToken ? 'Event' : 'Quest'}
              </Link>
            )}
            <a
              href={`https://amoy.polygonscan.com/token/${nft.contractAddress}?a=${nft.tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${relatedLink ? '' : 'flex-1'} py-2.5 px-4 border border-gray-300 hover:border-gray-400 text-gray-700 text-center font-medium rounded-lg transition-colors`}
            >
              View on Polygonscan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
