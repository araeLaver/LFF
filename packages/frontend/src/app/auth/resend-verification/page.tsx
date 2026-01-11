'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

export default function ResendVerificationPage() {
  const { user, token } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Please log in to resend verification email');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Verification email sent!');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send verification email');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <Card variant="bordered" className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Resend Verification Email</CardTitle>
            <CardDescription>Please log in to resend the verification email</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.emailVerified) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <Card variant="bordered" className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-600">Already Verified</CardTitle>
            <CardDescription>Your email is already verified!</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <Card variant="bordered" className="w-full max-w-md text-center">
        <CardHeader>
          {status === 'success' ? (
            <>
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-green-600">Email Sent!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Resend Verification Email</CardTitle>
              <CardDescription>
                Click the button below to receive a new verification email at <strong>{user.email}</strong>
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {status === 'error' && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {message}
            </div>
          )}

          {status === 'success' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Please check your email inbox and spam folder.
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">Go to Home</Button>
              </Link>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={handleResend}
              isLoading={status === 'loading'}
            >
              Send Verification Email
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
