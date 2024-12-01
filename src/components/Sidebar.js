/*
 * Sidebar.js
 *
 * Purpose:
 * This file defines a responsive sidebar navigation component that provides links to different pages of the application.
 * It includes toggling functionality to show/hide the sidebar on mobile and uses Firebase authentication to manage user login and logout.
 *
 * Key Features:
 * - Toggling sidebar visibility on mobile screens.
 * - Handles clicking outside the sidebar and pressing 'Escape' to close the sidebar.
 * - Dynamically renders links, including a logout link that triggers user sign-out.
 *
 * Usage:
 * - Import this component in your main layout to provide navigation throughout the app.
 */
'use client'; // Enable client-side rendering for this component


import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Custom hook for Firebase authentication
import { useTranslations } from 'use-intl';
import { Sidebar } from 'flowbite-react';
import { HiChartPie } from 'react-icons/hi';
import { IoMdAdd } from 'react-icons/io';
import { MdOutlineExplore, MdOutlineLeaderboard } from 'react-icons/md';
import { RiTeamLine } from 'react-icons/ri';
import { BiDonateHeart } from 'react-icons/bi';
import { FaPeopleCarryBox } from 'react-icons/fa6';
import { IoSettingsOutline } from 'react-icons/io5';
import { LuFileBadge2 } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import { GoOrganization } from "react-icons/go";

// Main Sidebar component
export default function Navbar() {
  // State for managing sidebar visibility (open/closed)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null); // Reference to sidebar element for detecting outside clicks
  const { user, logout } = useAuth(); // Destructures user and logout function from useAuth hook

  const t = useTranslations('Sidebar');
  // Function to toggle sidebar open/closed
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const router = useRouter();
  const handleNavigation = (path) => {
    router.push(path); // Navigate to the desired path
  };

  /*
   * Handles closing the sidebar when a link is clicked (only on mobile screens).
   * This checks window width to determine if the screen size is below 'sm' breakpoint (typically 640px).
   */
  const handleLinkClick = (path) => {
    handleNavigation(path);
    if (window.innerWidth < 640) {
      setIsSidebarOpen(false); // Close sidebar for mobile view
    }
  };

  /*
   * Sets up listeners for clicks outside of the sidebar and for the 'Escape' key to close it.
   * - Closes the sidebar if a click occurs outside of it or if 'Escape' is pressed.
   */
  useEffect(() => {
    function handleClickOutside(event) {
      // Checks if click was outside sidebar when it's open
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false); // Close sidebar
      }
    }

    function handleKeyDown(event) {
      if (isSidebarOpen && event.key === 'Escape') {
        setIsSidebarOpen(false); // Close sidebar on Escape key press
      }
    }

    

    // Register event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // Clean up listeners on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]); // Re-run effect if `isSidebarOpen` changes

  return (
    <div className='relative min-h-screen grid '>
      {/* Navbar button to toggle the sidebar */}
      {!isSidebarOpen && (
        <button
          data-drawer-target='logo-sidebar'
          data-drawer-toggle='logo-sidebar'
          aria-controls='logo-sidebar'
          type='button'
          onClick={toggleSidebar}
          className='absolute top-4 left-4 z-50 inline-flex items-center p-2 mr-6 mt-2 ms-3 text-sm text-orange-500 hover:text-gray-100 rounded-lg sm:hidden hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-gray-200'
        >
          <span className='sr-only'>Open sidebar</span>
          <svg
            className='w-6 h-6'
            aria-hidden='true'
            fill='currentColor'
            viewBox='0 0 20 20'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              clipRule='evenodd'
              fillRule='evenodd'
              d='M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z'
            ></path>
          </svg>
        </button>
      )}
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id='logo-sidebar'
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:static sm:translate-x-0`}
        aria-label='Sidebar'
      >
        <Sidebar aria-label='Sidebar' className='bg-orange-100'>
          <Sidebar.Logo href='#' img='/logo/favicon.png' imgAlt='Flowbite logo' className='text-gray-900'> 
            Wanna Gonna
          </Sidebar.Logo>
          <Sidebar.Items >
            <Sidebar.ItemGroup>
              <Sidebar.Item 
                onClick={() => handleLinkClick('/dashboard')} 
                icon={HiChartPie}
                className='cursor-pointer'>
                {t('dashboard')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/activities')}
                icon={MdOutlineExplore}
                className='cursor-pointer'
              >
                {t('explore')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/badges')}
                icon={LuFileBadge2}
                className='cursor-pointer'
              >
                {t('badges')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/leaderboard')}
                icon={MdOutlineLeaderboard }
                className='cursor-pointer'
              >
                {t('leaderboard')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/myteam')}
                icon={FaPeopleCarryBox}
                className='cursor-pointer'
              >
                {t('myteam')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/mynonprofit')}
                icon={GoOrganization}
                className='cursor-pointer'
              >
                {t('mynonprofit')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/members')}
                icon={RiTeamLine}
                className='cursor-pointer'
              >
                {t('members')}
              </Sidebar.Item>
              </Sidebar.ItemGroup>
              <Sidebar.ItemGroup>
              <Sidebar.Item
                onClick={() => handleLinkClick('/donate')}
                icon={BiDonateHeart}
                className='cursor-pointer'
              >
                {t('donate')}
              </Sidebar.Item>

              <Sidebar.Item
                onClick={() => handleLinkClick('/settings')}
                icon={IoSettingsOutline}
                className='cursor-pointer'
              >
                {t('settings')}
              </Sidebar.Item>
            </Sidebar.ItemGroup>
          </Sidebar.Items>
        </Sidebar>
      </aside>

      <div
        className={`p-4 transition-all duration-300 ${isSidebarOpen ? 'ml-30' : 'ml-0'} sm:ml-52`}
      >
      </div>
    </div>
  );
}