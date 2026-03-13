'use client';

import { getInitials, getAvatarColor } from './leaderboardConstants';

export default function Avatar({
  userId,
  displayName,
  profilePicture,
  size = 40,
  isChampion = false,
}) {
  const color = getAvatarColor(userId);

  if (profilePicture) {
    return (
      <div className="relative flex-shrink-0">
        <img
          src={profilePicture}
          alt={displayName || 'User'}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{
            boxShadow: isChampion
              ? '0 0 0 2.5px #F08602, 0 0 14px rgba(240,134,2,0.5)'
              : '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        {isChampion && (
          <span
            className="absolute -top-2 -right-1 leading-none drop-shadow-md"
            style={{ fontSize: Math.round(size * 0.32) }}
          >
            🏆
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex-shrink-0">
      <div
        className="flex items-center justify-center rounded-full font-extrabold text-white transition-shadow"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.36,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          boxShadow: isChampion
            ? '0 0 0 2.5px #F08602, 0 0 16px rgba(240,134,2,0.5)'
            : '0 2px 10px rgba(0,0,0,0.12)',
          fontFamily: "'Montserrat Alternates', sans-serif",
          letterSpacing: '-0.01em',
        }}
      >
        {getInitials(displayName)}
      </div>
      {isChampion && (
        <span
          className="absolute -top-2 -right-1 leading-none drop-shadow-md"
          style={{ fontSize: Math.round(size * 0.32) }}
        >
          🏆
        </span>
      )}
    </div>
  );
}
