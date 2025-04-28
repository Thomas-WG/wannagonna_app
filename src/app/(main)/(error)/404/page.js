"use client";

import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();
  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold text-blue-600 mb-4 animate-bounce">404</h1>
        <h2 className="text-3xl font-semibold mb-4">(╯°□°）╯︵ ┻━┻</h2>
        <h2 className="text-3xl font-semibold mb-4">Oops! Page Not Found</h2>
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <p className="text-lg text-gray-700 mb-4">
            Looks like this page went on a vacation without leaving a forwarding address!
          </p>
          <p className="text-lg text-gray-700 mb-4">
            Don&apos;t worry, even the best explorers get lost sometimes. 
            (Though we&apos;re not saying you&apos;re lost...)
          </p>
          <p className="text-lg text-gray-700">
            Maybe try using a map? 🗺️
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleGoBack}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
