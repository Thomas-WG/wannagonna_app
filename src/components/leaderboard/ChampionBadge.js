'use client';

/**
 * Wraps a badge display with champion glow and crown overlay for profile.
 * Use when user is champion of the dimension matching this badge (e.g. SDG).
 *
 * @param {string} dimensionLabel - e.g. "Climate Action"
 * @param {number} totalChampionships - Legacy counter (0 = hide counter)
 * @param {boolean} isCurrentChampion
 * @param {React.ReactNode} children - BadgeDisplay or similar
 */
export default function ChampionBadge({
  dimensionLabel,
  totalChampionships = 0,
  isCurrentChampion = false,
  children,
}) {
  return (
    <div
      className="relative inline-block"
      title={dimensionLabel}
    >
      <div
        className="relative inline-block rounded-2xl"
        style={{
          boxShadow: isCurrentChampion
            ? '0 0 0 2.5px #F08602, 0 0 18px rgba(240,134,2,0.55)'
            : 'none',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {children}
      </div>
      {isCurrentChampion && (
        <span
          className="absolute -top-2 -right-1 leading-none drop-shadow-md pointer-events-none"
          style={{ fontSize: 14 }}
        >
          🏆
        </span>
      )}
      {totalChampionships > 0 && (
        <span
          className="absolute -bottom-0.5 -right-1 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-tight font-heading"
          style={{
            background: isCurrentChampion ? '#F08602' : '#6b7280',
          }}
        >
          ×{totalChampionships}
        </span>
      )}
    </div>
  );
}
