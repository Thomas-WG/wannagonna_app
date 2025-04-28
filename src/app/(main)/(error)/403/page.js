"use client";

import { useRouter } from 'next/navigation';

export default function ForbiddenPage() {
  const router = useRouter();
  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold text-red-600 mb-4 animate-pulse">403</h1>
        <h2 className="text-3xl font-semibold mb-4">¯⁠\⁠_⁠(⁠ツ⁠)⁠_⁠/⁠¯</h2>
        <h2 className="text-3xl font-semibold mb-4">Oops! You're Not Supposed to Be Here</h2>
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <p className="text-lg text-gray-700 mb-4">
            Looks like you've wandered into the VIP section without a backstage pass!
          </p>
          <p className="text-lg text-gray-700 mb-4">
            Don't worry, even the best hackers get rejected sometimes. 
            (Though we're not saying you're a hacker...)
          </p>
          <p className="text-lg text-gray-700">
            Maybe try knocking next time? 🚪
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleGoBack}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
