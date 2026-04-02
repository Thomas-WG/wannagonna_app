'use client';

import ProfilePicture from '@/components/common/ProfilePicture';

export default function Avatar({
  displayName,
  profilePicture,
  size = 48,
  isChampion = false,
}) {
  const name = displayName?.trim() || 'Member';
  const alt = displayName?.trim() || 'Member';
  const src =
    typeof profilePicture === 'string' && profilePicture.trim()
      ? profilePicture.trim()
      : undefined;

  const listSizing = 'h-10 w-10 sm:h-12 sm:w-12';
  const championClass = isChampion
    ? 'ring-2 ring-[#F08602] ring-offset-2 ring-offset-white dark:ring-offset-neutral-900'
    : '';

  return (
    <div className="relative inline-flex flex-shrink-0">
      <ProfilePicture
        src={src}
        alt={alt}
        size={size}
        showInitials={true}
        name={name}
        loading="lazy"
        className={[listSizing, championClass].filter(Boolean).join(' ')}
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
