/*
 * Purpose:
 * This component displays a loading spinner overlay with a semi-transparent background and a centered spinning logo.
 * It is intended to provide visual feedback during loading states, such as data fetching or page transitions.
 *
 * Key Features:
 * - Full-screen overlay to cover the entire viewport or designated area.
 * - Uses the application's favicon as the spinning image.
 * - Custom animation for smooth, slow spinning.
 *
 * Usage:
 * - Import and render this component during loading states in pages or other components.
 */

import Image from 'next/image'; // Import Next.js Image component for optimized image handling

// LoadingSpinner component definition
const LoadingSpinner = () => {
  return (
    <div
      className='absolute top-0 left-0 w-full h-full flex items-center justify-center bg-transparent z-50'
    >
      {/* Centered spinning logo */}
      <div className='animate-spin-slow'>
        <Image
          src='/logo/Favicon.png' // Path to the logo image for the spinner
          alt='Loading...' // Accessible text for screen readers
          width={150} // Sets the width of the loading spinner image
          height={150} // Sets the height of the loading spinner image
          priority // Add priority to optimize LCP
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;
