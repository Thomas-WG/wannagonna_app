/**
 * Leaderboard constants and helpers.
 */

import { sdgNames } from '@/constant/sdgs';

// Must match functions/src/leaderboard/computeLeaderboard.js THRESHOLD
export const THRESHOLD = 1;

export const SDG_COLORS = {
  1: '#E5243B',
  2: '#DDA63A',
  3: '#4C9F38',
  4: '#C5192D',
  5: '#FF3A21',
  6: '#26BDE2',
  7: '#FCC30B',
  8: '#A21942',
  9: '#FD6925',
  10: '#DD1367',
  11: '#FD9D24',
  12: '#BF8B2E',
  13: '#3F7E44',
  14: '#0A97D9',
  15: '#56C02B',
  16: '#00689D',
  17: '#19486A',
};

export const SDG_LIST = Object.entries(sdgNames).map(([num, label]) => ({
  id: `sdg_${num}`,
  label,
  color: SDG_COLORS[num] || '#6b7280',
  num,
}));

/** Olympic ring colors for continent badges. */
export const CONTINENTS = [
  { id: 'africa', label: 'Africa', color: '#0081C8' },
  { id: 'america', label: 'Americas', color: '#FCB131' },
  { id: 'asia', label: 'Asia', color: '#000000' },
  { id: 'europe', label: 'Europe', color: '#00A651' },
  { id: 'oceania', label: 'Oceania', color: '#EE334E' },
];

export function getInitials(name) {
  if (!name || typeof name !== 'string') return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_PALETTE = [
  '#009AA2',
  '#F08602',
  '#CD1436',
  '#51AC31',
  '#3F7818',
  '#7B61FF',
  '#E8945A',
  '#4ECDC4',
];

export function getAvatarColor(userId) {
  if (!userId) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = userId.charCodeAt(i) + ((h << 5) - h);
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export function formatScore(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

export function getRankDisplay(rank) {
  if (rank === 1) return { emoji: '🥇', color: '#F08602' };
  if (rank === 2) return { emoji: '🥈', color: '#8B9BB4' };
  if (rank === 3) return { emoji: '🥉', color: '#CD7F32' };
  return null;
}
