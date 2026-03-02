'use client';

export default function DropItem({
  label,
  color,
  emoji,
  isSelected,
  onClick,
  locked,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left py-2 px-3 border-none cursor-pointer flex items-center gap-2 rounded-lg transition-colors ${
        compact ? 'text-[12.5px]' : 'text-[13px]'
      } ${
        isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-transparent'
      } ${locked ? 'text-text-tertiary dark:text-text-tertiary' : 'text-text-primary dark:text-text-primary'}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isSelected
          ? 'rgba(0,154,162,0.07)'
          : 'transparent';
      }}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
      )}
      {emoji && <span className="text-sm flex-shrink-0">{emoji}</span>}
      <span
        className={`flex-1 min-w-0 ${isSelected ? 'font-semibold' : 'font-normal'}`}
        style={compact ? { whiteSpace: 'nowrap' } : {}}
      >
        {label}
      </span>
      {locked && <span className="ml-auto text-[11px] flex-shrink-0">🔒</span>}
    </button>
  );
}
