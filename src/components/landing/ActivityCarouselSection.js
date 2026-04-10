'use client';

import { useEffect, useMemo, useState } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useTranslations } from 'next-intl';
import ActivityCard from '@/components/activities/ActivityCard';
import { fetchPublicLandingActivities } from '@/utils/crudActivities';

function getCardsPerView(width) {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

export default function ActivityCarouselSection({ sectionRef }) {
  const t = useTranslations('Landing');
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [activePage, setActivePage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Keep cards-per-view aligned with breakpoints (desktop/tablet/mobile).
    if (typeof window === 'undefined') return;
    const updateCardsPerView = () => setCardsPerView(getCardsPerView(window.innerWidth));
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      try {
        // One-time snapshot fetch for landing (no realtime listener).
        const result = await fetchPublicLandingActivities();
        if (!isMounted) return;
        if (!result || result.length < 3) {
          // Hide section when there is not enough content to form a carousel.
          setIsHidden(true);
          return;
        }
        setActivities(result);
      } catch (_) {
        // Requirement: fail silently by hiding the section.
        if (isMounted) setIsHidden(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadActivities();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalPages = useMemo(() => {
    if (!activities.length) return 0;
    return Math.ceil(activities.length / cardsPerView);
  }, [activities.length, cardsPerView]);

  useEffect(() => {
    // If viewport changes reduce total pages, reset to a valid page index.
    if (activePage > Math.max(0, totalPages - 1)) {
      setActivePage(0);
    }
  }, [activePage, totalPages]);

  useEffect(() => {
    // Autoplay advances pages and loops back to the beginning.
    if (isLoading || isHidden || totalPages <= 1 || isPaused) return undefined;
    const timer = setInterval(() => {
      setActivePage((prev) => (prev + 1) % totalPages);
    }, 3500);
    return () => clearInterval(timer);
  }, [isLoading, isHidden, totalPages, isPaused]);

  const goToPrev = () => {
    if (totalPages <= 1) return;
    setActivePage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToNext = () => {
    if (totalPages <= 1) return;
    setActivePage((prev) => (prev + 1) % totalPages);
  };

  if (!isLoading && (isHidden || activities.length < 3)) return null;

  return (
    <section
      ref={sectionRef}
      className="landing-animate-in is-visible px-4 py-16 sm:py-20"
      // Pause autoplay on hover/touch so users can inspect cards.
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onTouchCancel={() => setIsPaused(false)}
    >
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-[#9ca3af] text-xs font-bold tracking-[0.16em] uppercase font-montserrat-alt mb-3">
          {t('activityCarouselLabel')}
        </p>
        <h2 className="font-montserrat-alt font-bold text-2xl sm:text-3xl text-[#1A1A1A] mb-3 text-center">
          {t('activityCarouselTitle')}
        </h2>
        <p className="text-sm text-[#6b7280] font-light mb-8 text-center leading-relaxed">
          {t('activityCarouselSubtitle')}
        </p>

        <div className="relative">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm animate-pulse min-h-[280px]">
                  <div className="h-6 w-24 rounded bg-[#f1f5f9] mb-3" />
                  <div className="h-5 w-2/3 rounded bg-[#f1f5f9] mb-3" />
                  <div className="h-4 w-full rounded bg-[#f1f5f9] mb-2" />
                  <div className="h-4 w-4/5 rounded bg-[#f1f5f9] mb-6" />
                  <div className="h-20 w-full rounded bg-[#f8fafc]" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-hidden">
                <div
                  // Shift by full-page widths so each "group" slides as one unit.
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${activePage * 100}%)` }}
                >
                  {Array.from({ length: totalPages }).map((_, pageIdx) => {
                    const start = pageIdx * cardsPerView;
                    const pageItems = activities.slice(start, start + cardsPerView);

                    return (
                      <div key={pageIdx} className="w-full flex-shrink-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {pageItems.map((activity) => (
                            <ActivityCard
                              key={activity.id}
                              {...activity}
                              title={activity.title || 'Untitled activity'}
                              organization_name={activity.organization_name || 'WannaGonna'}
                              organization_logo={activity.organization_logo || ''}
                              onClick={() => {}}
                              canEditStatus={false}
                              showQRButton={false}
                              showStatusBadge={false}
                              isClickable
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {totalPages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrev}
                    aria-label="Previous activities"
                    className="hidden md:inline-flex items-center justify-center absolute left-[-14px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-[#e5e7eb] text-[#1A1A1A] shadow-sm hover:border-[#009AA2] hover:text-[#009AA2] transition-colors"
                  >
                    <HiChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    aria-label="Next activities"
                    className="hidden md:inline-flex items-center justify-center absolute right-[-14px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-[#e5e7eb] text-[#1A1A1A] shadow-sm hover:border-[#009AA2] hover:text-[#009AA2] transition-colors"
                  >
                    <HiChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to activities group ${idx + 1}`}
                onClick={() => setActivePage(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === activePage ? 'w-6 bg-[#009AA2]' : 'w-2.5 bg-[#d1d5db] hover:bg-[#9ca3af]'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
