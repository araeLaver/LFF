'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokenAndFetchUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (token) {
      // Save token and fetch user data
      setTokenAndFetchUser(token)
        .then(() => {
          router.push('/');
        })
        .catch((err) => {
          setError(err.message || 'Authentication failed');
        });
    } else {
      setError('No token received');
    }
  }, [searchParams, setTokenAndFetchUser, router]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4">Authentication Error: {error}</div>
        <button
          onClick={() => router.push('/auth/login')}
          className="text-blue-600 hover:underline"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loading size="lg" text="Completing authentication..." />
    </div>
  );
}
