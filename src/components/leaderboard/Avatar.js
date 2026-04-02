'use client';

import ProfilePicture from '@/components/common/ProfilePicture';

export default function Avatar({
  displayName,
  profilePicture,
  size = 40,
  isChampion = false,
}) {
  const name = displayName?.trim() || 'Member';
  const src =
    typeof profilePicture === 'string' && profilePicture.trim()
      ? profilePicture.trim()
      : undefined;

  return (
    <div className="relative inline-flex flex-shrink-0">
      <ProfilePicture
        src={src}
        alt={name}
        size={size}
        showInitials
        name={name}
        loading="lazy"
        className={
          isChampion
            ? 'shadow-[0_0_0_2.5px_#F08602,0_0_14px_rgba(240,134,2,0.5)]'
            : 'shadow-[0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
        }
      />
      {isChampion && (
        <span
          className="pointer-events-none absolute -right-1 -top-2 leading-none drop-shadow-md"
          style={{ fontSize: Math.round(size * 0.32) }}
          aria-hidden
        >
          🏆
        </span>
      )}
    </div>
  );
}
