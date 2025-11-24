'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/utils/auth/AuthContext';
import { fetchXpHistory } from '@/utils/crudXpHistory';
import { Card, Button } from 'flowbite-react';
import { HiStar, HiArrowLeft, HiClock } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { formatDate, getRelativeTime } from '@/utils/dateUtils';
import { useTranslations } from 'next-intl';

export default function XpHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('XpHistory');
  const [xpHistory, setXpHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadXpHistory = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const history = await fetchXpHistory(user.uid);
        setXpHistory(history);
      } catch (error) {
        console.error('Error loading XP history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadXpHistory();
  }, [user]);

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t('title') || 'XP History'}
        </h1>
        <p className="text-gray-600">
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
            <HiStar className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t('emptyTitle') || 'No XP History Yet'}
            </h3>
            <p className="text-gray-500">
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {entry.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
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
        </div>
      )}

      {/* Summary Card */}
      {!loading && xpHistory.length > 0 && (
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">
              {t('totalEntries') || 'Total Entries'}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {xpHistory.length}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {t('totalXp') || 'Total XP Earned'}: <span className="font-bold text-orange-600">
                {xpHistory.reduce((sum, entry) => sum + (entry.points || 0), 0)} XP
              </span>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

