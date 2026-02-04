'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/utils/auth/AuthContext';
import { fetchXpHistoryPaginated } from '@/utils/crudXpHistory';
import { Card, Button } from 'flowbite-react';
import { HiStar, HiArrowLeft, HiClock } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { formatDate, getRelativeTime } from '@/utils/dateUtils';
import { useTranslations } from 'next-intl';
import XpHistoryShareButton from '@/components/sharing/XpHistoryShareButton';

const PAGE_SIZE = 20;

export default function XpHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('XpHistory');
  const [xpHistory, setXpHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const observerTarget = useRef(null);

  const loadInitialXpHistory = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await fetchXpHistoryPaginated(user.uid, PAGE_SIZE, null);
      setXpHistory(result.entries);
      setHasMore(result.hasNextPage);
      setLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error loading XP history:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadInitialXpHistory();
  }, [loadInitialXpHistory]);

  // Load more entries when scrolling
  const loadMoreEntries = useCallback(async () => {
    if (!user?.uid || loadingMore || !hasMore || !lastDoc) {
      return;
    }

    try {
      setLoadingMore(true);
      const result = await fetchXpHistoryPaginated(user.uid, PAGE_SIZE, lastDoc);
      setXpHistory((prev) => [...prev, ...result.entries]);
      setHasMore(result.hasNextPage);
      setLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error loading more XP history:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [user?.uid, loadingMore, hasMore, lastDoc]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreEntries();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadMoreEntries]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            color="gray"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <HiArrowLeft className="h-4 w-4" />
            {t('back') || 'Back'}
          </Button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('title') || 'XP History'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('subtitle') || 'View your complete XP earning history'}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && xpHistory.length === 0 && (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center">
            <HiStar className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {t('emptyTitle') || 'No XP History Yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('emptyMessage') || 'Start earning XP by completing activities and earning badges!'}
            </p>
          </div>
        </Card>
      )}

      {/* XP History List */}
      {!loading && xpHistory.length > 0 && (
        <div className="space-y-4">
          {xpHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                        <HiStar className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {entry.title}
                        </h3>
                        <XpHistoryShareButton 
                          entry={entry}
                          variant="icon"
                          size="sm"
                          className="flex-shrink-0"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <HiClock className="h-4 w-4" />
                        <span>
                          {getRelativeTime(entry.timestamp)} • {formatDate(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-bold shadow-md">
                    <HiStar className="h-5 w-5 fill-current" />
                    <span className="text-lg">+{entry.points} XP</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {/* Infinite scroll trigger and loading indicator */}
          <div ref={observerTarget} className="py-4">
            {loadingMore && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            {!hasMore && xpHistory.length > 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <p>{t('noMoreEntries') || 'No more entries to load'}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

