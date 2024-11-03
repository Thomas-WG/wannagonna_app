// src/components/ActivityCard.js

import Image from 'next/image';

export default function ActivityCard({ npoName, npoLogo, title, location, applicants, points }) {
  return (
    <a href="#" className="block max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
      <div className="flex items-center">
        <Image src={npoLogo} alt={`${npoName} Logo`} width={50} height={50} className="rounded-full" />
        <div className="ml-3">
          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h5>
          <p className="text-sm text-gray-500">{npoName}</p>
          <p className="text-sm text-gray-500">{location}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-gray-600 dark:text-gray-400">{applicants} applied</span>
        <span className="px-2 py-1 text-sm font-medium text-white bg-orange-500 rounded-full">{points} points</span>
      </div>
    </a>
  );
}
