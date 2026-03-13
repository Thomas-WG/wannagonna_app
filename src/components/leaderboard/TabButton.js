'use client';

export default function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-heading font-bold text-[13px] cursor-pointer transition-all flex items-center gap-1.5 ${
        active
          ? 'border-2 border-primary-400/60 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
          : 'border-2 border-transparent text-text-tertiary dark:text-text-tertiary'
      }`}
    >
      {children}
    </button>
  );
}
