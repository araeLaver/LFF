'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { GatedContent, ContentType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Loading } from '@/components/ui';

export default function ContentPage() {
  const [contents, setContents] = useState<GatedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await api.getAllGatedContent();
        setContents(data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading content..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Exclusive Content</h1>
        <p className="text-gray-600 mt-1">Unlock exclusive content with your NFTs</p>
      </div>

      {contents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      ) : (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-gray-500">No exclusive content available</p>
        </Card>
      )}
    </div>
  );
}

function ContentCard({ content }: { content: GatedContent }) {
  const typeIcons: Record<ContentType, string> = {
    VIDEO: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    IMAGE:
      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    AUDIO:
      'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    DOCUMENT:
      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    OTHER: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  };

  const typeColors: Record<ContentType, string> = {
    VIDEO: 'bg-red-100 text-red-600',
    IMAGE: 'bg-green-100 text-green-600',
    AUDIO: 'bg-purple-100 text-purple-600',
    DOCUMENT: 'bg-blue-100 text-blue-600',
    OTHER: 'bg-gray-100 text-gray-600',
  };

  const isGated = content.requiredNftContract || content.requiredNftId;
  const creatorName = content.creator?.user?.profile?.nickname || 'Creator';

  return (
    <Link href={`/content/${content.id}`}>
      <Card variant="bordered" className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        {content.previewUrl ? (
          <div
            className="h-40 bg-cover bg-center"
            style={{ backgroundImage: `url(${content.previewUrl})` }}
          />
        ) : (
          <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className={`p-4 rounded-full ${typeColors[content.contentType]}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[content.contentType]} />
              </svg>
            </div>
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${typeColors[content.contentType]}`}>
              {content.contentType}
            </span>
            {isGated ? (
              <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                NFT Required
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                Free Access
              </span>
            )}
          </div>
          <CardTitle className="line-clamp-2">{content.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {content.description && <p className="text-gray-600 text-sm line-clamp-2 mb-3">{content.description}</p>}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
              {creatorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-600">{creatorName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
