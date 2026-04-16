'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/utils/auth/AuthContext';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useLeaderboardDimensions } from '@/hooks/useLeaderboardDimensions';
import PublicProfileModal from '@/components/profile/PublicProfileModal';
import LeaderboardPanel from './LeaderboardPanel';
import TabButton from './TabButton';
import DropItem from './DropItem';
import ActivityScoreTooltip from './ActivityScoreTooltip';
import { SDG_LIST, CONTINENTS, THRESHOLD } from './leaderboardConstants';

export default function LeaderboardPage() {
  const t = useTranslations('Leaderboard');
  const { user } = useAuth();
  const [tab, setTab] = useState('alltime');
  const [sdg, setSdg] = useState('sdg_13');
  const [continent, setContinent] = useState('europe');
  const [sdgOpen, setSdgOpen] = useState(false);
  const [contOpen, setContOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const sdgRef = useRef(null);
  const contRef = useRef(null);

  const { sdg: activeSdgIds, continent: activeContinentIds } = useLeaderboardDimensions();

  const filteredSdgs = activeSdgIds.length > 0
    ? SDG_LIST.filter((s) => activeSdgIds.includes(s.id))
    : SDG_LIST;
  const filteredContinents = activeContinentIds.length > 0
    ? CONTINENTS.filter((c) => activeContinentIds.includes(c.id))
    : CONTINENTS;

  const dimensionId =
    tab === 'alltime' ? 'alltime' : tab === 'global' ? 'global' : tab === 'sdg' ? sdg : continent;

  const { entries, loading } = useLeaderboard(dimensionId);

  const activeLabel =
    tab === 'alltime'
      ? t('allTime')
      : tab === 'global'
      ? t('global')
      : tab === 'sdg'
      ? filteredSdgs.find((s) => s.id === sdg)?.label ?? SDG_LIST.find((s) => s.id === sdg)?.label
      : filteredContinents.find((c) => c.id === continent)?.label ?? CONTINENTS.find((c) => c.id === continent)?.label;

  const closeAll = () => {
    setSdgOpen(false);
    setContOpen(false);
  };

  const handleOpenProfile = (userId) => {
    if (!userId) return;
    setSelectedUserId(userId);
    setProfileModalOpen(true);
  };

  // Reset sdg/continent when filtered lists change and current selection is no longer valid
  useEffect(() => {
    if (filteredSdgs.length > 0 && !filteredSdgs.some((s) => s.id === sdg)) {
      setSdg(filteredSdgs[0].id);
    }
  }, [filteredSdgs, sdg]);

  useEffect(() => {
    if (filteredContinents.length > 0 && !filteredContinents.some((c) => c.id === continent)) {
      setContinent(filteredContinents[0].id);
    }
  }, [filteredContinents, continent]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        sdgRef.current &&
        !sdgRef.current.contains(event.target) &&
        contRef.current &&
        !contRef.current.contains(event.target)
      ) {
        closeAll();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="font-sans font-light min-h-dvh px-4 py-8 pb-[72px]" style={{ background: 'transparent' }}>
      <style>{`
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="max-w-[560px] mx-auto"
        onClick={closeAll}
      >
        <div className="mb-7 animate-[pageIn_0.45s_ease_both]">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl">🏆</span>
            <h1 className="font-heading font-black text-2xl text-text-primary dark:text-text-primary tracking-tight">
              {t('title')}
            </h1>
          </div>
        </div>

        <div
          className="relative z-[100] flex flex-col md:flex-row gap-1.5 mb-4 [&>*]:w-full md:[&>*]:w-auto animate-[pageIn_0.45s_0.08s_ease_both]"
          onClick={(e) => e.stopPropagation()}
        >
          <TabButton
            active={tab === 'alltime'}
            onClick={() => {
              setTab('alltime');
              closeAll();
            }}
          >
            🏆 {t('allTime')}
          </TabButton>
          <TabButton
            active={tab === 'global'}
            onClick={() => {
              setTab('global');
              closeAll();
            }}
          >
            ⚡ {t('global')}
          </TabButton>

          <div ref={sdgRef} className="relative">
            <TabButton
              active={tab === 'sdg'}
              onClick={() => {
                setTab('sdg');
                setSdgOpen((p) => !p);
                setContOpen(false);
              }}
            >
              🌐 {t('bySdg')}{' '}
              <span className="text-[9px] opacity-70">
                {sdgOpen ? '▲' : '▼'}
              </span>
            </TabButton>
            {sdgOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 rounded-2xl border-2 border-border-light dark:border-border-dark shadow-xl z-[9999] min-w-[280px] p-1.5 max-h-[290px] overflow-y-auto animate-[dropIn_0.18s_ease_both]"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(16px)',
                }}
                role="listbox"
              >
                {filteredSdgs.map((s) => (
                  <DropItem
                    key={s.id}
                    label={s.label}
                    color={s.color}
                    isSelected={sdg === s.id}
                    locked={dimensionId === s.id && entries.length < THRESHOLD}
                    onClick={() => {
                      setSdg(s.id);
                      setSdgOpen(false);
                    }}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          <div ref={contRef} className="relative">
            <TabButton
              active={tab === 'continent'}
              onClick={() => {
                setTab('continent');
                setContOpen((p) => !p);
                setSdgOpen(false);
              }}
            >
              🗺️ {t('byRegion')}{' '}
              <span className="text-[9px] opacity-70">
                {contOpen ? '▲' : '▼'}
              </span>
            </TabButton>
            {contOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 rounded-2xl border-2 border-border-light dark:border-border-dark shadow-xl z-[9999] min-w-[190px] p-1.5 animate-[dropIn_0.18s_ease_both]"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(16px)',
                }}
                role="listbox"
              >
                {filteredContinents.map((c) => (
                  <DropItem
                    key={c.id}
                    label={c.label}
                    color={c.color}
                    isSelected={continent === c.id}
                    locked={
                      dimensionId === c.id &&
                      entries.length < THRESHOLD
                    }
                    onClick={() => {
                      setContinent(c.id);
                      setContOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-text-secondary dark:text-text-secondary mb-3 leading-relaxed animate-[pageIn_0.45s_0.12s_ease_both]">
          {tab === 'alltime'
            ? t('descriptionAllTime')
            : tab === 'global'
            ? t('descriptionGlobal')
            : tab === 'sdg'
            ? t('descriptionSdg')
            : t('descriptionRegion')}
        </p>

        <div className="flex items-center justify-between mb-3 animate-[pageIn_0.45s_0.14s_ease_both]">
          <div className="font-heading font-extrabold text-base text-text-primary dark:text-text-primary">
            {activeLabel}
          </div>
          <div className="flex items-center text-sm text-text-secondary dark:text-text-secondary font-normal">
            {t('activityScore')} <ActivityScoreTooltip />
          </div>
        </div>

        <div
          className="relative z-0 border-2 border-border-light dark:border-border-dark rounded-2xl p-3.5 shadow-sm animate-[pageIn_0.45s_0.18s_ease_both]"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 28px rgba(0,0,0,0.05)',
          }}
        >
          <LeaderboardPanel
            key={dimensionId}
            dimensionId={dimensionId}
            label={activeLabel}
            entries={entries}
            currentUserId={user?.uid}
            loading={loading}
            onOpenProfile={handleOpenProfile}
          />
        </div>

        <p className="text-center text-[11.5px] text-text-tertiary dark:text-text-tertiary mt-4 leading-relaxed animate-[pageIn_0.45s_0.25s_ease_both]">
          {t('footer')}
        </p>

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
