'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/utils/auth/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import BackButton from '@/components/layout/BackButton';
import {
  Card,
  Table,
  Avatar,
  Select,
  Button,
  Tooltip,
  Checkbox,
} from 'flowbite-react';
import {
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiMail,
} from 'react-icons/hi';
import { MdOutlineSocialDistance } from 'react-icons/md';
import { HiOfficeBuilding, HiCalendar } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { useNPOParticipants } from '@/hooks/dashboard/useNPOParticipants';

const pageSize = 20;

function formatActivityDate(date, locale) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export default function NPOParticipantsPage() {
  const t = useTranslations('MyNonProfit');
  const locale = useLocale();
  const { user, claims, loading: authLoading } = useAuth();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [filters, setFilters] = useState({ activityType: 'all' });
  const [sortBy, setSortBy] = useState('participated_newest');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const organizationId = claims?.npoId || null;
  const selectedSet = useMemo(() => new Set(selectedParticipantIds), [selectedParticipantIds]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setSelectedParticipantIds([]);
  }, [filters, debouncedSearchQuery]);

  const {
    allParticipants,
    totalCount: totalCountAll,
    isLoading,
    error,
  } = useNPOParticipants(organizationId, filters, sortBy, currentPage, pageSize);

  const searchedParticipants = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return allParticipants || [];
    const q = debouncedSearchQuery.toLowerCase();
    return (allParticipants || []).filter((p) =>
      (p.displayName || '').toLowerCase().includes(q)
    );
  }, [allParticipants, debouncedSearchQuery]);

  const totalCount = searchedParticipants.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, totalCount);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const paginatedParticipants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchedParticipants.slice(start, start + pageSize);
  }, [searchedParticipants, currentPage]);

  const handleParticipantClick = (userId) => {
    setSelectedUserId(userId);
    setProfileModalOpen(true);
  };

  const handleToggleParticipant = (userId, e) => {
    e.stopPropagation();
    setSelectedParticipantIds((prev) => {
      const set = new Set(prev);
      if (set.has(userId)) set.delete(userId);
      else set.add(userId);
      return [...set];
    });
  };

  const handleSelectAll = () => {
    setSelectedParticipantIds(searchedParticipants.map((p) => p.userId));
  };

  const handleContactParticipants = () => {
    const selectedWithEmail = (allParticipants || []).filter(
      (p) => selectedSet.has(p.userId) && p.email && String(p.email).trim()
    );
    const emails = selectedWithEmail.map((p) => p.email.trim());
    if (emails.length === 0) {
      alert(t('noEmailsAvailable'));
      return;
    }
    const subject = encodeURIComponent(t('emailSubjectParticipants'));
    const mailtoLink = `mailto:?bcc=${encodeURIComponent(emails.join(','))}&subject=${subject}`;
    window.location.href = mailtoLink;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user && !authLoading) return null;
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 dark:border-primary-400" />
      </div>
    );
  }
  if (!organizationId) {
    router.replace('/mynonprofit');
    return null;
  }

  const ActivityTypeIcons = ({ online, local, event }) => (
    <div className="flex items-center gap-2">
      <Tooltip content={online ? t('online') : t('notParticipated')} placement="top">
        <span className="inline-flex">
          <MdOutlineSocialDistance
            className={`h-5 w-5 sm:h-6 sm:w-6 ${
              online
                ? 'text-activityType-online-600 dark:text-activityType-online-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </span>
      </Tooltip>
      <Tooltip content={local ? t('local') : t('notParticipated')} placement="top">
        <span className="inline-flex">
          <HiOfficeBuilding
            className={`h-5 w-5 sm:h-6 sm:w-6 ${
              local
                ? 'text-activityType-local-600 dark:text-activityType-local-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </span>
      </Tooltip>
      <Tooltip content={event ? t('event') : t('notParticipated')} placement="top">
        <span className="inline-flex">
          <HiCalendar
            className={`h-5 w-5 sm:h-6 sm:w-6 ${
              event
                ? 'text-activityType-event-600 dark:text-activityType-event-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </span>
      </Tooltip>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-page dark:bg-background-page overflow-x-hidden">
      <div className="container mx-auto px-4 py-6 max-w-7xl w-full min-w-0 max-w-full">
        <div className="mb-4">
          <BackButton fallbackPath="/mynonprofit" translationNamespace="MyNonProfit" />
        </div>

        <div className="mb-6 min-w-0 overflow-hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary mb-2 break-words">
            {t('participantsList')}
          </h1>
          <p className="text-text-secondary dark:text-text-secondary break-words">
            {t('participantsSubtitle')}
          </p>
        </div>

        {/* Search + filters: stacked on mobile, single row from sm */}
        <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center sm:justify-between w-full min-w-0 max-w-full">
          <div className="relative w-full min-w-0 sm:flex-1 sm:max-w-md">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary dark:text-text-tertiary" />
            <input
              type="text"
              placeholder={t('searchParticipants')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 max-w-full pl-10 pr-4 py-2 rounded-lg bg-background-card dark:bg-background-card border border-border-light dark:border-border-dark text-text-primary dark:text-text-primary placeholder-text-tertiary dark:placeholder-text-tertiary"
            />
          </div>
          {/* Filter and sort: two full-width rows on mobile, inline from sm */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-2 w-full sm:w-auto min-w-0 max-w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <label className="text-sm font-medium text-text-primary dark:text-text-primary shrink-0 whitespace-nowrap">
                {t('filterByActivityType')}
              </label>
              <Select
                value={filters.activityType}
                onChange={(e) =>
                  setFilters({ ...filters, activityType: e.target.value })
                }
                className="flex-1 min-w-0 w-full sm:flex-initial sm:w-auto max-w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
              >
                <option value="all">{t('allActivities')}</option>
                <option value="online">{t('online')}</option>
                <option value="local">{t('local')}</option>
                <option value="event">{t('event')}</option>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <label className="text-sm font-medium text-text-primary dark:text-text-primary shrink-0 whitespace-nowrap">
                {t('sortBy')}
              </label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 min-w-0 w-full sm:flex-initial sm:w-auto max-w-full bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border-border-light dark:border-border-dark"
              >
                <option value="name_az">{t('sortNameAZ')}</option>
                <option value="name_za">{t('sortNameZA')}</option>
                <option value="participated_newest">{t('participatedNewest')}</option>
                <option value="participated_oldest">{t('participatedOldest')}</option>
              </Select>
            </div>
          </div>
        </div>

        {totalCount > 0 && (
          <p className="text-sm text-text-tertiary dark:text-text-tertiary mb-3 min-w-0 break-words">
            {t('showingParticipants', {
              start: startIndex,
              end: endIndex,
              total: totalCount,
            })}
          </p>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 dark:border-primary-400" />
          </div>
        )}

        {error && !isLoading && (
          <Card className="mb-4 bg-background-card dark:bg-background-card">
            <p className="text-text-secondary dark:text-text-secondary">
              {t('errorLoadingParticipants')}
            </p>
            <Button color="gray" onClick={() => window.location.reload()}>
              {t('retry')}
            </Button>
          </Card>
        )}

        {!isLoading && !error && paginatedParticipants.length === 0 && (
          <Card className="bg-background-card dark:bg-background-card border-border-light dark:border-border-dark">
            <p className="text-center py-8 text-text-secondary dark:text-text-secondary">
              {(allParticipants?.length ?? 0) === 0
                ? t('noParticipants')
                : t('noParticipantsMatchSearch')}
            </p>
          </Card>
        )}

        {!isLoading && !error && paginatedParticipants.length > 0 && (
          <>
            <div className="mb-3 flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                color="gray"
                onClick={handleSelectAll}
                className="shrink-0"
              >
                {t('selectAll')}
              </Button>
              <Button
                size="sm"
                color="primary"
                onClick={handleContactParticipants}
                disabled={selectedSet.size === 0}
                className="shrink-0 inline-flex items-center gap-1.5"
              >
                <HiMail className="h-4 w-4" />
                {t('contactParticipants')}
                {selectedSet.size > 0 && (
                  <span className="ml-0.5 font-semibold">({selectedSet.size})</span>
                )}
              </Button>
            </div>

            <div className="hidden lg:block overflow-x-auto min-w-0 w-full">
              <Table className="w-full table-fixed">
                <Table.Head>
                  <Table.HeadCell className="text-xs w-8 px-2 py-1.5">
                    <span className="sr-only">{t('select')}</span>
                  </Table.HeadCell>
                  <Table.HeadCell className="text-xs w-10 px-2 py-1.5">
                    {t('profilePicture')}
                  </Table.HeadCell>
                  <Table.HeadCell className="text-xs min-w-0 w-[1%] px-2 py-1.5">
                    {t('displayName')}
                  </Table.HeadCell>
                  <Table.HeadCell className="text-xs w-24 px-2 py-1.5 whitespace-nowrap">
                    {t('firstActivity')}
                  </Table.HeadCell>
                  <Table.HeadCell className="text-xs w-24 px-2 py-1.5 whitespace-nowrap">
                    {t('lastActivity')}
                  </Table.HeadCell>
                  <Table.HeadCell className="text-xs w-20 px-2 py-1.5">
                    {t('activityTypes')}
                  </Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {paginatedParticipants.map((p) => (
                    <Table.Row
                      key={p.userId}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleParticipantClick(p.userId)}
                    >
                      <Table.Cell className="px-2 py-1.5 w-8" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedSet.has(p.userId)}
                          onChange={(e) => handleToggleParticipant(p.userId, e)}
                          className="cursor-pointer"
                        />
                      </Table.Cell>
                      <Table.Cell className="px-2 py-1.5 w-10">
                        <Avatar
                          img={p.profilePicture || '/favicon.ico'}
                          alt={p.displayName || 'Participant'}
                          size="xs"
                          rounded
                          className="w-7 h-7 flex-shrink-0"
                        />
                      </Table.Cell>
                      <Table.Cell className="px-2 py-1.5 min-w-0 w-[1%] font-medium text-text-primary dark:text-text-primary">
                        <span className="block truncate text-sm">{p.displayName || t('anonymous')}</span>
                      </Table.Cell>
                      <Table.Cell className="px-2 py-1.5 w-24 text-text-secondary dark:text-text-secondary text-xs whitespace-nowrap">
                        {formatActivityDate(p.createdAt, locale)}
                      </Table.Cell>
                      <Table.Cell className="px-2 py-1.5 w-24 text-text-secondary dark:text-text-secondary text-xs whitespace-nowrap">
                        {formatActivityDate(p.lastValidatedAt, locale)}
                      </Table.Cell>
                      <Table.Cell className="px-2 py-1.5 w-20">
                        <ActivityTypeIcons
                          online={p.online}
                          local={p.local}
                          event={p.event}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>

            <div className="lg:hidden space-y-1 w-full min-w-0 overflow-hidden">
              {paginatedParticipants.map((p) => (
                <Card
                  key={p.userId}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-background-card dark:bg-background-card border-border-light dark:border-border-dark !py-0.5 !px-2.5 overflow-hidden min-w-0"
                  onClick={() => handleParticipantClick(p.userId)}
                >
                  <div className="flex items-center gap-2 min-h-[2.25rem] min-w-0 overflow-hidden">
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                      <Checkbox
                        checked={selectedSet.has(p.userId)}
                        onChange={(e) => handleToggleParticipant(p.userId, e)}
                        className="cursor-pointer"
                      />
                    </div>
                    <Avatar
                      img={p.profilePicture || '/favicon.ico'}
                      alt={p.displayName || 'Participant'}
                      size="md"
                      rounded
                      className="flex-shrink-0 w-9 h-9"
                    />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="font-medium text-sm text-text-primary dark:text-text-primary truncate">
                        {p.displayName || t('anonymous')}
                      </h3>
                      <p className="hidden sm:block text-xs text-text-tertiary dark:text-text-tertiary truncate">
                        {t('firstActivityShort')} {formatActivityDate(p.createdAt, locale)}
                        {' · '}
                        {t('lastActivityShort')} {formatActivityDate(p.lastValidatedAt, locale)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <ActivityTypeIcons
                        online={p.online}
                        local={p.local}
                        event={p.event}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  color="gray"
                  disabled={!hasPreviousPage}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <HiChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-text-secondary dark:text-text-secondary">
                  {t('pageOf', { current: currentPage, total: totalPages })}
                </span>
                <Button
                  size="sm"
                  color="gray"
                  disabled={!hasNextPage}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <HiChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </>
        )}

        <PublicProfileModal
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
          isOwnProfile={selectedUserId === user?.uid}
        />
      </div>
    </div>
  );
}
