'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NFT } from '@/types';

interface NFTCardProps {
  nft: NFT;
  onClick?: () => void;
}

export function NFTCard({ nft, onClick }: NFTCardProps) {
  const isEventToken = nft.tokenType === 'EVENT_ATTENDANCE';
  const isQuestToken = nft.tokenType === 'QUEST_COMPLETION';

  const title = isEventToken
    ? nft.event?.title || 'Event Attendance'
    : isQuestToken
      ? nft.quest?.title || 'Quest Completion'
      : `Token #${nft.tokenId}`;

  const creatorName = isEventToken
    ? nft.event?.creator?.displayName || nft.event?.creator?.user?.profile?.nickname
    : nft.quest?.creator?.displayName || nft.quest?.creator?.user?.profile?.nickname;

  const mintDate = nft.mintedAt
    ? new Date(nft.mintedAt).toLocaleDateString()
    : new Date(nft.createdAt).toLocaleDateString();

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-gray-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Image/Gradient Area */}
      <div
        className={`aspect-square relative overflow-hidden ${
          isEventToken
            ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400'
            : isQuestToken
              ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400'
              : 'bg-gradient-to-br from-gray-400 to-gray-600'
        }`}
      >
        {/* Token Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isEventToken
                ? 'bg-purple-900/70 text-white'
                : isQuestToken
                  ? 'bg-blue-900/70 text-white'
                  : 'bg-gray-900/70 text-white'
            }`}
          >
            {isEventToken ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Event
              </>
            ) : isQuestToken ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quest
              </>
            ) : (
              'SBT'
            )}
          </span>
        </div>

        {/* Soulbound Badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Soulbound
          </span>
        </div>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {isEventToken ? (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : isQuestToken ? (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            ) : (
              <span className="text-3xl font-bold text-white">NFT</span>
            )}
          </div>
        </div>

        {/* Token ID */}
        <div className="absolute bottom-3 left-3 right-3">
          <span className="text-white/80 text-xs font-mono">
            #{nft.tokenId}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        {creatorName && (
          <p className="text-sm text-gray-500 mt-1 truncate">
            by {creatorName}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <span>Minted {mintDate}</span>
          <a
            href={`https://amoy.polygonscan.com/token/${nft.contractAddress}?a=${nft.tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-500 hover:text-blue-600"
          >
            View on chain
          </a>
        </div>
      </div>
    </div>
  );
}
