import React from 'react';

export default function ProgressStepper({ currentStep }) {
  const steps = [
    { number: 1, label: 'Category' },
    { number: 2, label: 'Details' },
    { number: 3, label: 'SDG' }
  ];

  return (
    <div className="w-full mb-6 sm:mb-8">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.number}>
              <li className="flex items-center">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-orange-500 text-white shadow-lg scale-110'
                        : isActive
                        ? 'bg-orange-100 border-2 border-orange-500 text-orange-500 shadow-md scale-110'
                        : 'bg-orange-100 border border-orange-300 text-orange-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="text-sm sm:text-base font-bold">{step.number}</span>
                    )}
                  </span>
                  <span
                    className={`hidden sm:block mt-2 text-xs font-medium transition-colors duration-300 ${
                      isActive ? 'text-orange-500' : isCompleted ? 'text-orange-600' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </li>
              {!isLast && (
                <li className="flex w-full items-center">
                  <div
                    className={`w-full h-1 sm:h-1.5 transition-all duration-500 ${
                      isCompleted ? 'bg-orange-500' : 'bg-orange-100'
                    } rounded-full`}
                  />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}
