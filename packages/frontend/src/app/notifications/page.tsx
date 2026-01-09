'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardHeader, CardTitle, CardContent, Button, Loading } from '@/components/ui';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    pushEnabled,
    pushSupported,
    markAsRead,
    markAllAsRead,
    enablePush,
    disablePush,
  } = useNotifications();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'QUEST_APPROVED': return '✅';
      case 'QUEST_REJECTED': return '❌';
      case 'EVENT_REMINDER': return '📅';
      case 'NEW_CONTENT': return '🆕';
      case 'NFT_MINTED': return '🎨';
      default: return '🔔';
    }
  };

  const getNotificationLink = (notification: any) => {
    const data = notification.data || {};
    if (data.questId) return `/quests/${data.questId}`;
    if (data.eventId) return `/events/${data.eventId}`;
    if (data.contentId) return `/content/${data.contentId}`;
    if (data.tokenId) return '/mypage';
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>
      </div>

      {/* Push Notification Settings */}
      <Card variant="bordered" className="mb-6">
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {pushSupported ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {pushEnabled ? 'Push notifications enabled' : 'Push notifications disabled'}
                </p>
                <p className="text-sm text-gray-500">
                  {pushEnabled
                    ? 'You will receive notifications even when not on the site'
                    : 'Enable to receive notifications when away'}
                </p>
              </div>
              <Button
                variant={pushEnabled ? 'outline' : 'primary'}
                onClick={pushEnabled ? disablePush : enablePush}
              >
                {pushEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          ) : (
            <p className="text-gray-500">
              Push notifications are not supported in your browser
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card variant="bordered">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <Loading text="Loading notifications..." />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const content = (
                  <div
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex gap-4">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                          </div>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={notification.id} href={link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
