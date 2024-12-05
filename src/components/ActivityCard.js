import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function ActivityCard({
  npoName,
  npoLogo,
  title,
  location,
  applicants,
  points,
  description,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Toggle function for expanding/collapsing
  const toggleExpand = () => setIsExpanded(!isExpanded);
  const t=useTranslations('ActivityCard');
  return (
    <div
      onClick={toggleExpand}
      className='cursor-pointer block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-all duration-300'
    >
      <div className='flex items-center'>
        <Image
          src={npoLogo}
          alt={`${npoName} Logo`}
          width={50}
          height={50}
          className='rounded-full'
        />
        <div className='ml-3'>
          <h5 className='text-lg font-semibold text-gray-900 dark:text-white'>
            {title}
          </h5>
          <p className='text-sm text-gray-500'>{npoName}</p>
          <p className='text-sm text-gray-500'>{location}</p>
        </div>
      </div>
      <div className='flex items-center justify-between mt-3'>
        <span className='text-gray-600 dark:text-gray-400'>
          {applicants} applied
        </span>
        <span className='px-2 py-1 text-sm font-medium text-white bg-orange-500 rounded-full'>
          {points} {t('points')}
        </span>
      </div>
      {isExpanded && (
        <div className='mt-4'>
          <div className='font-semibold'>Description:</div>
          <p className='text-sm text-gray-900'>
            {description || 'No description available'}
          </p>
          <button className='mt-4 px-4 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition'>
            Apply Now
          </button>
        </div>
      )}
    </div>
  );
}
