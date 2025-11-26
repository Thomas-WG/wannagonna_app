'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/utils/auth/AuthContext';
import {
  useNotificationsListener,
  markNotificationAsReadClient,
  markAllNotificationsAsReadClient,
  clearAllNotificationsClient,
} from '@/utils/notifications';
import {getRelativeTime} from '@/utils/dateUtils';

const Header = () => {
  const router = useRouter();
  const {user} = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const {
    notifications,
    unreadCount,
  } = useNotificationsListener(user?.uid || null);

  const handleMenuClick = (path) => {
    router.push(path); // Navigate to the desired path
  };

  const toggleNotifications = () => {
    setIsNotifOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.readAt) {
        // Fire-and-forget; realtime listener will refresh state
        void markNotificationAsReadClient(notification.id);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
    setIsNotifOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    setIsNotifOpen(false);
    try {
      void markAllNotificationsAsReadClient();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to mark all notifications as read:', error);
      }
    }
  };

  const handleClearAll = async () => {
    setIsNotifOpen(false);
    try {
      void clearAllNotificationsClient();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to clear notifications:', error);
      }
    }
  };

  const handleViewAll = () => {
    // Future: navigate to a dedicated notifications page
    router.push('/xp-history');
    setIsNotifOpen(false);
  };

  // Simple mapping for type-based accent color (can be extended later)
  const getTypeAccentClass = (type) => {
    switch (type) {
      case 'REWARD':
        return 'bg-green-100 text-green-600';
      case 'REMINDER':
        return 'bg-yellow-100 text-yellow-600';
      case 'SYSTEM':
        return 'bg-blue-100 text-blue-600';
      case 'REFERRAL':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <header className="w-full relative z-40 bg-gradient-to-b from-[rgb(243_244_246)] to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center p-2">
          <div className="flex space-x-2 items-center">
            {/* Notification icon + dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Notifications"
                aria-haspopup="true"
                aria-expanded={isNotifOpen}
              >
                <svg
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div
                  className="fixed inset-x-2 top-14 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg bg-white shadow-lg ring-1 ring-black/5
                             sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 sm:max-h-96"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] text-gray-500 hover:text-gray-700"
                        >
                          Mark all as read
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-[11px] text-red-500 hover:text-red-600"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {notifications.length === 0 && (
                      <div className="px-4 py-6 text-sm text-gray-500 text-center">
                        You have no notifications yet.
                      </div>
                    )}

                    {notifications.slice(0, 10).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition flex items-start gap-3 ${
                          !notification.readAt ? 'bg-gray-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div
                          className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getTypeAccentClass(notification.type)}`}
                        >
                          {notification.type?.[0] || 'N'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {notification.title || 'Notification'}
                            </p>
                            <span className="text-[11px] text-gray-400 shrink-0">
                              {notification.createdAt
                                ? getRelativeTime(notification.createdAt)
                                : ''}
                            </span>
                          </div>
                          {notification.body && (
                            <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                              {notification.body}
                            </p>
                          )}
                        </div>
                        {!notification.readAt && (
                          <span className="ml-2 mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    ))}
                  </div>

                </div>
              )}
            </div>

            {/* User menu */}
            <button
              onClick={() => handleMenuClick('/complete-profile')}
              className="p-2 rounded-full hover:bg-gray-100 hover:scale-110 hover:shadow-md transition-all duration-200 focus:outline-none"
            >
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;