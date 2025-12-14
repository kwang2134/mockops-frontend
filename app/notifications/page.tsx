'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { getNotifications, markNotificationAsRead, deleteNotification } from '@/lib/api/notifications';
import type { Notification } from '@/lib/api/notifications';
import { formatDateTimeKST } from '@/lib/utils/date';
import { getNotificationTypeLabel } from '@/lib/utils/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn) {
      loadNotifications();
    }
  }, [isLoggedIn]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      setNotifications(response.notifications);
      setTotalUnreadCount(response.totalUnreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n))
      );
      setTotalUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);
      const notification = notifications.find((n) => n.notificationId === notificationId);
      setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
      if (notification && !notification.isRead) {
        setTotalUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.notificationId);
    }
    if (notification.redirectUrl) {
      router.push(notification.redirectUrl);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 pt-24 flex items-center justify-center">
          <div className="text-lg text-gray-600">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">알림</h1>
            <p className="text-gray-600 text-lg">
              미확인 알림 {totalUnreadCount}개
            </p>
          </div>

          {/* 알림 목록 */}
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">알림이 없습니다</h3>
              <p className="text-gray-600">새로운 알림이 도착하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className={`bg-white rounded-xl border p-6 transition-all cursor-pointer hover:shadow-lg ${
                    notification.isRead
                      ? 'border-gray-200'
                      : 'border-blue-200 bg-blue-50/30'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                        <h3 className="font-bold text-gray-900">{notification.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            notification.type === 'HEALTH_CHECK_FAILURE'
                              ? 'bg-red-100 text-red-800'
                              : notification.type === 'MEMBER_INVITATION_RECEIVED'
                              ? 'bg-green-100 text-green-800'
                              : notification.type === 'SERVER_STATUS_CHANGED'
                              ? 'bg-blue-100 text-blue-800'
                              : notification.type === 'MEMBER_INVITATION_ACCEPTED'
                              ? 'bg-purple-100 text-purple-800'
                              : notification.type === 'MOCK_BULK_SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : notification.type === 'MOCK_BULK_FAILURE'
                              ? 'bg-orange-100 text-orange-800'
                              : notification.type === 'SYSTEM_ANNOUNCEMENT'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      <div className="text-sm text-gray-500">
                        {formatDateTimeKST(notification.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.notificationId);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
