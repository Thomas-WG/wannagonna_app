'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Spinner,
  Table,
  TextInput,
  Badge,
  Tooltip,
  Checkbox,
} from 'flowbite-react';
import { HiUsers, HiMail, HiSearch, HiCheck, HiUser, HiX } from 'react-icons/hi';
import { MdOutlineSocialDistance } from 'react-icons/md';
import { HiOfficeBuilding, HiCalendar } from 'react-icons/hi';
import { useAuth } from '@/utils/auth/AuthContext';
import { useTranslations } from 'next-intl';
import { useModal } from '@/utils/modal/useModal';
import BackButton from '@/components/layout/BackButton';
import ProfilePicture from '@/components/common/ProfilePicture';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import { useNPOParticipants } from '@/hooks/dashboard/useNPOParticipants';

const SORT_LAST = 'lastParticipation';
const SORT_FIRST = 'firstParticipation';
const SORT_NAME = 'name';

function formatDate(date) {
  if (!date) return '';
  try {
    const dateObj =
      date instanceof Date
        ? date
        : date?.toDate
          ? date.toDate()
          : date?.seconds
            ? new Date(date.seconds * 1000)
            : new Date(date);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch {
    return '';
  }
}

export default function ParticipantsPage() {
  const t = useTranslations('MyNonProfit');
  const { claims } = useAuth();
  const organizationId = claims?.npoId ?? null;

  const { participants, isLoading, error, refetch } = useNPOParticipants(
    organizationId,
    null
  );

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState({ online: false, local: false, event: false });
  const [sortBy, setSortBy] = useState(SORT_LAST);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [profileModalUserId, setProfileModalUserId] = useState(null);
  const headerCheckboxRef = useRef(null);

  const wrappedCloseProfile = useModal(
    !!profileModalUserId,
    () => setProfileModalUserId(null),
    'participants-profile-modal'
  );

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const filteredParticipants = useMemo(() => {
    let list = [...participants];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        (p.displayName || '').toLowerCase().includes(q)
      );
    }

    const hasTypeFilter = typeFilter.online || typeFilter.local || typeFilter.event;
    if (hasTypeFilter) {
      list = list.filter(
        (p) =>
          (typeFilter.online && p.online) ||
          (typeFilter.local && p.local) ||
          (typeFilter.event && p.event)
      );
    }

    list.sort((a, b) => {
      if (sortBy === SORT_NAME) {
        return (a.displayName || '').localeCompare(b.displayName || '');
      }
      const aFirst = a.createdAt?.toDate?.() ?? (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : null);
      const bFirst = b.createdAt?.toDate?.() ?? (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : null);
      const aLast = a.lastValidatedAt?.toDate?.() ?? (a.lastValidatedAt?.seconds ? new Date(a.lastValidatedAt.seconds * 1000) : null);
      const bLast = b.lastValidatedAt?.toDate?.() ?? (b.lastValidatedAt?.seconds ? new Date(b.lastValidatedAt.seconds * 1000) : null);
      if (sortBy === SORT_FIRST) {
        return (bFirst?.getTime() ?? 0) - (aFirst?.getTime() ?? 0);
      }
      return (bLast?.getTime() ?? 0) - (aLast?.getTime() ?? 0);
    });

    return list;
  }, [participants, search, typeFilter, sortBy]);

  useEffect(() => {
    clearSelection();
  }, [search, typeFilter, sortBy, clearSelection]);

  useEffect(() => {
    const ref = headerCheckboxRef.current;
    if (!ref) return;
    const count = filteredParticipants.filter((p) => selectedIds.has(p.userId)).length;
    ref.indeterminate = count > 0 && count < filteredParticipants.length;
    ref.checked = filteredParticipants.length > 0 && count === filteredParticipants.length;
  }, [filteredParticipants, selectedIds]);

  const toggleSelectAll = useCallback(() => {
    const visibleIds = new Set(filteredParticipants.map((p) => p.userId));
    const selected = new Set(selectedIds);
    const allSelected = filteredParticipants.every((p) => selected.has(p.userId));
    if (allSelected) {
      visibleIds.forEach((id) => selected.delete(id));
    } else {
      visibleIds.forEach((id) => selected.add(id));
    }
    setSelectedIds(new Set(selected));
  }, [filteredParticipants, selectedIds]);

  const toggleSelect = useCallback((userId, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const handleSendMail = useCallback(() => {
    const selected = filteredParticipants.filter((p) => selectedIds.has(p.userId));
    const emails = selected
      .map((p) => p.email)
      .filter((e) => e && String(e).trim());
    if (emails.length === 0) {
      alert(t('noEmailsAvailable') ?? 'No email addresses available for the selected participants.');
      return;
    }
    const subject = encodeURIComponent(
      t('emailSubjectParticipants') || t('emailSubject', { activityTitle: 'Participants' }) || 'Regarding: Participants'
    );
    const mailtoLink = `mailto:?bcc=${encodeURIComponent(emails.join(','))}&subject=${subject}`;
    window.location.href = mailtoLink;
  }, [filteredParticipants, selectedIds, t]);

  const handleOpenProfile = useCallback((userId) => {
    setProfileModalUserId(userId);
  }, []);

  const handleRowClickToggleSelect = useCallback((userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const selectedCount = selectedIds.size;

  if (!organizationId) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <p className="text-text-secondary dark:text-text-secondary">
          {t('noOrganization') ?? 'No organization found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background-page dark:bg-background-page min-h-dvh">
      <div className="mb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl sm:text-2xl font-semibold text-text-primary dark:text-text-primary">
          {t('participants')}
        </h1>
      </div>

      {/* Toolbar */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <TextInput
              icon={HiSearch}
              placeholder={t('searchParticipants') ?? 'Search participants'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
              aria-label={t('searchParticipants') ?? 'Search participants'}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-tertiary dark:text-text-tertiary hidden sm:inline">
              {t('filterByType') ?? 'Type:'}
            </span>
            <button
              type="button"
              onClick={() => setTypeFilter((f) => ({ ...f, online: !f.online }))}
              className={`min-h-[44px] min-w-[44px] sm:min-w-0 px-3 rounded-lg border flex items-center gap-1.5 text-sm ${
                typeFilter.online
                  ? 'bg-activityType-online-100 dark:bg-activityType-online-900 border-activityType-online-500'
                  : 'bg-background-card dark:bg-background-card border-border-light dark:border-border-dark'
              }`}
              aria-label={t('online')}
              aria-pressed={typeFilter.online}
            >
              <MdOutlineSocialDistance className="h-4 w-4" />
              <span className="hidden sm:inline">{t('online')}</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter((f) => ({ ...f, local: !f.local }))}
              className={`min-h-[44px] min-w-[44px] sm:min-w-0 px-3 rounded-lg border flex items-center gap-1.5 text-sm ${
                typeFilter.local
                  ? 'bg-activityType-local-100 dark:bg-activityType-local-900 border-activityType-local-500'
                  : 'bg-background-card dark:bg-background-card border-border-light dark:border-border-dark'
              }`}
              aria-label={t('local')}
              aria-pressed={typeFilter.local}
            >
              <HiOfficeBuilding className="h-4 w-4" />
              <span className="hidden sm:inline">{t('local')}</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter((f) => ({ ...f, event: !f.event }))}
              className={`min-h-[44px] min-w-[44px] sm:min-w-0 px-3 rounded-lg border flex items-center gap-1.5 text-sm ${
                typeFilter.event
                  ? 'bg-activityType-event-100 dark:bg-activityType-event-900 border-activityType-event-500'
                  : 'bg-background-card dark:bg-background-card border-border-light dark:border-border-dark'
              }`}
              aria-label={t('events')}
              aria-pressed={typeFilter.event}
            >
              <HiCalendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('events')}</span>
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="min-h-[44px] rounded-lg border border-border-light dark:border-border-dark bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary text-sm px-3"
            aria-label={t('sortBy') ?? 'Sort by'}
          >
            <option value={SORT_LAST}>{t('sortLastParticipation') ?? 'Last participation'}</option>
            <option value={SORT_FIRST}>{t('sortFirstParticipation') ?? 'First participation'}</option>
            <option value={SORT_NAME}>{t('sortByName') ?? 'Name'}</option>
          </select>
          <div className="flex items-center gap-2">
            <Tooltip content={t('selectAllFiltered') ?? 'Select all shown'}>
              <Button
                size="sm"
                color="light"
                onClick={toggleSelectAll}
                className="min-h-[44px] min-w-[44px] p-2 sm:min-w-0 sm:px-3"
                aria-label={t('selectAllFiltered') ?? 'Select all shown'}
              >
                <HiCheck className="h-5 w-5 sm:mr-1" />
                <span className="hidden sm:inline">{t('selectAll') ?? 'Select all'}</span>
              </Button>
            </Tooltip>
            {selectedCount > 0 && (
              <>
                <Tooltip content={t('sendMail') ?? 'Send a mail (BCC)'}>
                  <Button
                    size="sm"
                    color="primary"
                    onClick={handleSendMail}
                    className="min-h-[44px] min-w-[44px] p-2 sm:min-w-0 sm:px-3"
                    aria-label={t('sendMail') ?? 'Send a mail'}
                  >
                    <HiMail className="h-5 w-5 sm:mr-1" />
                    <span className="hidden sm:inline">{t('sendMail') ?? 'Send a mail'}</span>
                  </Button>
                </Tooltip>
                <Button
                  size="sm"
                  color="light"
                  onClick={clearSelection}
                  className="min-h-[44px] min-w-[44px] p-2 sm:min-w-0 sm:px-3"
                  aria-label={t('clearSelection') ?? 'Clear selection'}
                >
                  <HiX className="h-5 w-5 sm:mr-1" />
                  <span className="hidden sm:inline">{t('clearSelection') ?? 'Clear'}</span>
                </Button>
              </>
            )}
          </div>
        </div>
        {selectedCount > 0 && (
          <p className="text-sm text-text-secondary dark:text-text-secondary" aria-live="polite">
            {t('selectedCount', { count: selectedCount }) ?? `${selectedCount} selected`}
          </p>
        )}
      </div>

      {/* Sticky selection bar (mobile-friendly) */}
      {selectedCount > 0 && (
        <div className="sticky top-0 z-10 mb-4 py-3 px-4 rounded-lg bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 flex flex-wrap items-center justify-between gap-2 safe-area-padding">
          <span className="font-medium text-text-primary dark:text-text-primary">
            {t('selectedCount', { count: selectedCount }) ?? `${selectedCount} selected`}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" color="primary" onClick={handleSendMail} className="min-h-[44px]">
              <HiMail className="h-5 w-5 mr-2" />
              {t('sendMail') ?? 'Send a mail'}
            </Button>
            <Button size="sm" color="light" onClick={clearSelection} className="min-h-[44px]">
              {t('clearSelection') ?? 'Clear'}
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error.message ?? 'Failed to load participants.'}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Spinner size="xl" />
        </div>
      ) : filteredParticipants.length === 0 ? (
        <div className="text-center py-16">
          <HiUsers className="mx-auto h-12 w-12 text-text-tertiary dark:text-text-tertiary mb-4" />
          <p className="text-text-secondary dark:text-text-secondary">
            {participants.length === 0
              ? (t('noParticipants') ?? 'No participants yet')
              : (t('noParticipantsMatchFilter') ?? 'No participants match the current filters.')}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border-light dark:border-border-dark">
            <Table hoverable className="w-full">
              <Table.Head>
                <Table.HeadCell className="w-12">
                  <div className="min-h-[44px] min-w-[44px] flex items-center">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      onChange={toggleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={t('selectAllFiltered') ?? 'Select all shown'}
                      className="h-4 w-4 rounded border-border-light dark:border-border-dark bg-background-card dark:bg-background-card text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                </Table.HeadCell>
                <Table.HeadCell>{t('participant') ?? 'Participant'}</Table.HeadCell>
                <Table.HeadCell>{t('activityTypes') ?? 'Activity types'}</Table.HeadCell>
                <Table.HeadCell>{t('firstParticipation') ?? 'First participation'}</Table.HeadCell>
                <Table.HeadCell>{t('lastParticipation') ?? 'Last participation'}</Table.HeadCell>
                <Table.HeadCell className="w-32">{t('actions') ?? 'Actions'}</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y divide-border-light dark:divide-border-dark">
                {filteredParticipants.map((p) => (
                  <Table.Row
                    key={p.userId}
                    className="cursor-pointer bg-background-card dark:bg-background-card"
                    onClick={() => handleRowClickToggleSelect(p.userId)}
                  >
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <div className="min-h-[44px] min-w-[44px] flex items-center">
                        <Checkbox
                          checked={selectedIds.has(p.userId)}
                          onChange={(e) => toggleSelect(p.userId, e)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={t('selectParticipant', { name: p.displayName }) ?? `Select ${p.displayName}`}
                        />
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <ProfilePicture
                          src={p.profilePicture}
                          alt={p.displayName}
                          size={40}
                          showInitials
                          name={p.displayName}
                          className="flex-shrink-0"
                        />
                        <span className="font-medium text-text-primary dark:text-text-primary truncate">
                          {p.displayName ?? '—'}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1">
                        {p.online && (
                          <Badge color="info" size="sm" className="inline-flex items-center gap-0.5">
                            <MdOutlineSocialDistance className="h-3 w-3" />
                            {t('online')}
                          </Badge>
                        )}
                        {p.local && (
                          <Badge color="success" size="sm" className="inline-flex items-center gap-0.5">
                            <HiOfficeBuilding className="h-3 w-3" />
                            {t('local')}
                          </Badge>
                        )}
                        {p.event && (
                          <Badge color="purple" size="sm" className="inline-flex items-center gap-0.5">
                            <HiCalendar className="h-3 w-3" />
                            {t('event')}
                          </Badge>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary dark:text-text-secondary text-sm whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary dark:text-text-secondary text-sm whitespace-nowrap">
                      {formatDate(p.lastValidatedAt)}
                    </Table.Cell>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="xs"
                        color="light"
                        onClick={() => handleOpenProfile(p.userId)}
                        className="min-h-[44px]"
                        aria-label={t('viewProfile') ?? 'View profile'}
                      >
                        <HiUser className="h-4 w-4 mr-1" />
                        {t('viewProfile') ?? 'View profile'}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>

          {/* Mobile: Card list */}
          <div className="md:hidden space-y-3">
            {filteredParticipants.map((p) => (
              <div
                key={p.userId}
                role="button"
                tabIndex={0}
                onClick={() => handleRowClickToggleSelect(p.userId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClickToggleSelect(p.userId);
                  }
                }}
                className="flex items-start gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark bg-background-card dark:bg-background-card hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left cursor-pointer"
              >
                <div
                  className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedIds.has(p.userId)}
                    onChange={(e) => toggleSelect(p.userId, e)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t('selectParticipant', { name: p.displayName }) ?? `Select ${p.displayName}`}
                  />
                </div>
                <ProfilePicture
                  src={p.profilePicture}
                  alt={p.displayName}
                  size={48}
                  showInitials
                  name={p.displayName}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary dark:text-text-primary truncate">
                    {p.displayName ?? '—'}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.online && (
                      <Badge color="info" size="sm">{t('online')}</Badge>
                    )}
                    {p.local && (
                      <Badge color="success" size="sm">{t('local')}</Badge>
                    )}
                    {p.event && (
                      <Badge color="purple" size="sm">{t('event')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-1">
                    {t('firstParticipation')}: {formatDate(p.createdAt)} · {t('lastParticipation')}: {formatDate(p.lastValidatedAt)}
                  </p>
                </div>
                <Button
                  size="xs"
                  color="light"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenProfile(p.userId);
                  }}
                  className="min-h-[44px] flex-shrink-0"
                  aria-label={t('viewProfile') ?? 'View profile'}
                >
                  <HiUser className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t('viewProfile')}</span>
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {profileModalUserId && (
        <PublicProfileModal
          isOpen={!!profileModalUserId}
          onClose={() => {
            wrappedCloseProfile();
            setProfileModalUserId(null);
          }}
          userId={profileModalUserId}
          isOwnProfile={false}
        />
      )}
    </div>
  );
}
