import React from 'react';

export default function ProgressStepper({ currentStep }) {
  return (
    <ol className="flex items-center w-full mb-8">
      <li className={`flex w-full items-center ${currentStep > 1 ? ' after:border-orange-500' : ' after:border-orange-100'} after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block`}>
        <span className={`flex items-center justify-center w-10 h-10 ${currentStep > 1 ? 'bg-orange-500' : 'bg-orange-100 border border-orange-500'} rounded-full lg:h-12 lg:w-12 shrink-0`}>
          {currentStep > 1 ? (
            <svg className="w-3.5 h-3.5 text-white lg:w-4 lg:h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5.917L5.724 10.5L15 1.5" />
            </svg>
          ) : (
            <span className="text-orange-500 font-semibold">1</span>
          )}
        </span>
      </li>
      <li className={`flex w-full items-center ${currentStep > 2 ? ' after:border-orange-500' : ' after:border-orange-100'} after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block`}>
        <span className={`flex items-center justify-center w-10 h-10 ${currentStep > 2 ? 'bg-orange-500 border border-orange-500' : currentStep === 2 ? 'border border-orange-500 bg-orange-100':'bg-orange-100'} rounded-full lg:h-12 lg:w-12 shrink-0`}>
          {currentStep > 2 ? (
            <svg className="w-3.5 h-3.5 text-white lg:w-4 lg:h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5.917L5.724 10.5L15 1.5" />
            </svg>
          ) : (
            <span className="text-orange-500 font-semibold">2</span>
          )}
        </span>
      </li>
      <li className="flex items-center">
        <span className={`flex items-center justify-center w-10 h-10 ${currentStep === 3 ? 'bg-orange-100 border border-orange-500' : 'bg-orange-100'} rounded-full lg:h-12 lg:w-12 shrink-0`}>
          {currentStep === 3 ? (
            <span className="text-why font-semibold">3</span>
          ) : (
            <span className="text-orange-500 font-semibold">3</span>
          )}
        </span>
      </li>
    </ol>
  );
}
