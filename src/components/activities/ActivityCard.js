import { Tooltip } from 'flowbite-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  HiLocationMarker, HiUserGroup, HiStar,
  HiQuestionMarkCircle,
  HiCode, HiPencil, HiTranslate, HiDocumentText, HiLightBulb, HiDatabase, HiCamera, HiShare, HiSupport, HiAcademicCap, HiHeart, HiClock, HiPlay, HiSparkles, HiBookOpen, HiTruck, HiUsers, HiClipboardList, HiGift, HiPresentationChartLine, HiUserCircle, HiShoppingBag
} from 'react-icons/hi';
import { FaPaw, FaLeaf, FaChild, FaWrench, FaPaintBrush } from 'react-icons/fa';
import { IoMegaphone } from 'react-icons/io5';

// Main component for displaying an activity card
export default function ActivityCard({
  id,
  organization_name,
  organization_logo,
  title,
  country,
  category,
  skills,
  applicants,
  type,
  xp_reward,
  city,
  description,
  start_date,
  end_date,
  sdg,
  onClick,
}) {
  const t = useTranslations('ActivityCard');
  const tManage = useTranslations('ManageActivities');

  // Category icon mapping (same as CategorySelector)
  const categoryIcons = {
    website: HiCode,
    logo: HiPencil,
    translation: HiTranslate,
    flyer: HiDocumentText,
    consulting: HiLightBulb,
    architecture: HiSparkles,
    dataentry: HiDatabase,
    photovideo: HiCamera,
    sns: HiShare,
    onlinesupport: HiSupport,
    education: HiAcademicCap,
    fundraising: HiHeart,
    longtermrole: HiClock,
    explainer: HiPlay,
    other: HiQuestionMarkCircle,
    cleaning: HiSparkles,
    teaching: HiBookOpen,
    food_distribution: HiTruck,
    elderly_support: HiUserGroup,
    animal_care: FaPaw,
    environment: FaLeaf,
    community_events: HiUsers,
    childcare: FaChild,
    manual_labor: FaWrench,
    administrative: HiClipboardList,
    fundraising_event: HiGift,
    awareness_campaign: IoMegaphone,
    workshop: HiPresentationChartLine,
    seminar_conference: HiUserCircle,
    charity_walk: HiUsers,
    networking: HiUserGroup,
    arts_and_crafts: FaPaintBrush,
    food_fair: HiShoppingBag
  };

  const formatDateTimeRange = (start, end) => {
    if (!start) return null;
    try {
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : null;

      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric'
      });

      const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      });

      const datePart = dateFormatter.format(startDate);
      const startTime = timeFormatter.format(startDate);
      const endTime = endDate ? timeFormatter.format(endDate) : null;

      return endTime ? `${datePart}, ${startTime} - ${endTime}` : `${datePart}, ${startTime}`;
    } catch (e) {
      return null;
    }
  };

  const dateTimeLine = formatDateTimeRange(start_date, end_date);

  // presentational component only; click handling provided by parent via onClick

  return (
    <>
      <div
        onClick={onClick}
        className="cursor-pointer w-96 mx-auto p-4 bg-white border border-gray-200 rounded-xl shadow-md hover:bg-gray-50 transition-all duration-300"
        role="button"
        aria-label={title}
      >
        {/* Header Section (Top) */}
        <div className='flex items-start justify-between'>
          <div className='flex items-center space-x-2'>
            <Image
              src={organization_logo}
              alt={`${organization_name} logo`}
              width={40}
              height={40}
              className='rounded-full'
            />
            <span className='text-xs text-gray-500 truncate max-w-[160px]' aria-label={organization_name}>{organization_name}</span>
          </div>
          <div className='flex items-center'>
            {(() => {
              const Icon = categoryIcons[category] || HiQuestionMarkCircle;
              const label = (() => {
                try { return tManage(category); } catch { return category; }
              })();
              return (
                <Tooltip content={label} placement="top">
                  <span aria-label={label} role="img" tabIndex={0} className='inline-flex'>
                    <Icon aria-hidden className='text-grey-400' size={28} />
                  </span>
                </Tooltip>
              );
            })()}
            <span className='sr-only'>{category}</span>
          </div>
        </div>

        {/* Title */}
        <div className='mt-3 h-14 flex items-start'>
          <h2 className='text-xl font-bold text-gray-900 leading-tight break-words'>{title}</h2>
        </div>

        {/* Key Information Section (Middle) */}
        <div className='mt-3 space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center text-base font-semibold text-indigo-600'>
              <HiStar className='mr-1 text-indigo-500' />
              <span>{xp_reward} {t('points')}</span>
            </div>
            <div className='flex items-center text-sm font-semibold text-gray-700'>
              <HiUserGroup className='mr-1 text-gray-600' />
              <span>{applicants} {t('applied')}</span>
            </div>
          </div>

          {skills?.length > 0 && (
            <div className='flex flex-wrap gap-1' aria-label={t('skills')}>
              {skills.map((skill, index) => (
                <span key={index} className='px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800'>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Section (Bottom) */}
        <div className='mt-3 pt-3 border-t border-gray-200'>
          <div className='flex flex-col space-y-1'>
            <div className='flex items-center justify-between'>
              {/* SDG Icon on the left */}
              {sdg && (
                <div className='flex items-center'>
                  <Image
                    src={`/icons/sdgs/c-${sdg}.png`}
                    alt={`SDG ${sdg}`}
                    width={28}
                    height={28}
                  />
                </div>
              )}
              
              {/* Location on the right */}
              <div className='flex items-center text-sm text-gray-700'>
                <HiLocationMarker className='mr-1 text-gray-500' />
                <span className='truncate'>
                  {type === 'online' 
                    ? `Online (${country})`
                    : type === 'event'
                      ? `Event - ${city}, ${country}`
                      : type === 'local' 
                        ? `Local - ${city}, ${country}`
                        : ''}
                </span>
              </div>
            </div>
            {dateTimeLine && (
              <div className='text-sm text-gray-700'>
                {dateTimeLine}
              </div>
            )}
          </div>

        </div>

      </div>

      
    </>
  );
}
