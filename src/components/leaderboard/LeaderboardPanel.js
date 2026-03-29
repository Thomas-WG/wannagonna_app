'use client';

import LeaderboardRow from './LeaderboardRow';
import MyRankBanner from './MyRankBanner';
import ThresholdGate from './ThresholdGate';
import { THRESHOLD } from './leaderboardConstants';

export default function LeaderboardPanel({
  dimensionId,
  label,
  entries,
  currentUserId,
  loading,
  isDormant = false,
}) {
  const meetsThreshold = entries.length >= THRESHOLD;
  const top10 = entries.slice(0, 10);
  const topScore = top10[0]?.activity_score ?? 1;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!meetsThreshold) {
    return <ThresholdGate label={label} current={entries.length} />;
  }

  return (
    <div>
      {isDormant && (
        <div
          style={{
            background: 'rgba(240,134,2,0.08)',
            border: '1px solid rgba(240,134,2,0.2)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            color: '#6b7280',
            marginBottom: 12,
          }}
        >
          ⏸ No recent activity · Rankings paused · Be the first to reactivate this leaderboard
        </div>
      )}
      {top10.map((entry, i) => (
        <LeaderboardRow
          key={entry.user_id}
          entry={entry}
          index={i}
          isMe={entry.user_id === currentUserId}
          isLast={i === top10.length - 1}
          topScore={topScore}
        />
      ))}
      <MyRankBanner entries={entries} currentUserId={currentUserId} />
    </div>
  );
}
