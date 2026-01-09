'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { GatedContent, ContentType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Loading } from '@/components/ui';

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState<GatedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessReason, setAccessReason] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Use preview endpoint which doesn't require auth
        const data = await api.getGatedContentPreview(params.id as string);
        setContent(data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [params.id]);

  // Check access when user is authenticated
  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated || !content) return;

      const isGated = content.requiredNftContract || content.requiredNftId;
      if (!isGated) {
        setHasAccess(true);
        return;
      }

      setIsCheckingAccess(true);
      try {
        const result = await api.checkGatedContentAccess(params.id as string);
        setHasAccess(result.hasAccess);
        if (!result.hasAccess && result.reason) {
          setAccessReason(result.reason);
        }
      } catch (err) {
        console.error('Failed to check access:', err);
      } finally {
        setIsCheckingAccess(false);
      }
    };
    checkAccess();
  }, [isAuthenticated, content, params.id]);

  const handleUnlock = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setIsUnlocking(true);
    setError('');

    try {
      const result = await api.accessGatedContent(params.id as string);
      setAccessUrl(result.accessUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock content');
    } finally {
      setIsUnlocking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading content..." />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Content not found</h1>
        <Link href="/content">
          <Button variant="outline">Back to Content</Button>
        </Link>
      </div>
    );
  }

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/content" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Content
      </Link>

      <Card variant="bordered">
        {/* Content Preview */}
        <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-t-xl overflow-hidden">
          {accessUrl ? (
            <div className="text-center">
              <p className="text-green-600 font-medium mb-4">Content Unlocked!</p>
              <a
                href={accessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Content
              </a>
            </div>
          ) : content.previewUrl ? (
            <img
              src={content.previewUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`p-6 rounded-full ${typeColors[content.contentType]}`}>
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={typeIcons[content.contentType]}
                />
              </svg>
            </div>
          )}
        </div>

        <CardHeader>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded ${typeColors[content.contentType]}`}>
              {content.contentType}
            </span>
            {isGated ? (
              <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                NFT Gated
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                Free Access
              </span>
            )}
            {isAuthenticated && hasAccess === true && (
              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                Access Granted
              </span>
            )}
          </div>
          <CardTitle className="text-2xl">{content.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Creator Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium">
              {creatorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{creatorName}</p>
              <p className="text-sm text-gray-500">Content Creator</p>
            </div>
          </div>

          {/* Description */}
          {content.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About this content</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{content.description}</p>
            </div>
          )}

          {/* NFT Requirement */}
          {isGated && (
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">NFT Required</h3>
              <p className="text-sm text-yellow-700 mb-2">To access this content, you need to own an NFT from:</p>
              {content.requiredNftContract && (
                <p className="font-mono text-xs text-yellow-800 bg-yellow-100 p-2 rounded break-all">
                  {content.requiredNftContract}
                </p>
              )}
              {content.requiredTokenId && (
                <p className="text-sm text-yellow-700 mt-2">Specific Token ID: {content.requiredTokenId}</p>
              )}
            </div>
          )}

          {/* Access Status */}
          {isAuthenticated && isCheckingAccess && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-sm flex items-center gap-2">
              <Loading size="sm" />
              Checking your access...
            </div>
          )}

          {isAuthenticated && hasAccess === false && accessReason && (
            <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-sm">
              {accessReason}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          {/* Action Button */}
          {!accessUrl && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleUnlock}
              isLoading={isUnlocking}
              disabled={isCheckingAccess || (isAuthenticated && hasAccess === false)}
            >
              {!isAuthenticated
                ? 'Login to Access'
                : hasAccess === true
                ? 'Access Content'
                : hasAccess === false
                ? 'NFT Required'
                : 'Check Access'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
