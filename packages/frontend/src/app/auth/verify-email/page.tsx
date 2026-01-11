'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Loading, Button } from '@/components/ui';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`
        );
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <Card variant="bordered" className="w-full max-w-md text-center">
        <CardHeader>
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4">
                <Loading size="lg" />
              </div>
              <CardTitle className="text-2xl">Verifying your email...</CardTitle>
              <CardDescription>Please wait while we verify your email address</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-red-600">Verification Failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {status !== 'loading' && (
            <div className="space-y-3">
              {status === 'success' && (
                <Link href="/auth/login">
                  <Button className="w-full">Sign In</Button>
                </Link>
              )}
              {status === 'error' && (
                <>
                  <Link href="/auth/login">
                    <Button className="w-full">Go to Login</Button>
                  </Link>
                  <p className="text-sm text-gray-500">
                    Need a new verification link?{' '}
                    <Link href="/auth/resend-verification" className="text-blue-600 hover:underline">
                      Resend email
                    </Link>
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <Loading size="lg" text="Loading..." />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
