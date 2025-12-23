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


import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/utils/auth/AuthContext'; // Custom hook for Firebase authentication
import { useTranslations } from 'use-intl';
import { Sidebar } from 'flowbite-react';
import { HiChartPie, HiQuestionMarkCircle, HiLightBulb } from 'react-icons/hi';
import { MdOutlineExplore, MdOutlineLeaderboard } from 'react-icons/md';
import { RiTeamLine } from 'react-icons/ri';
import { BiDonateHeart } from 'react-icons/bi';
import { FaPeopleCarryBox } from 'react-icons/fa6';
import { IoSettingsOutline } from 'react-icons/io5';
import { LuFileBadge2 } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import { GoOrganization } from "react-icons/go";
import { IoLogOut } from "react-icons/io5";
import { FaUserShield } from "react-icons/fa";
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from 'firebaseConfig';

// Main Sidebar component
export default function Navbar() {
  // State for managing sidebar visibility (open/closed)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const sidebarRef = useRef(null); // Reference to sidebar element for detecting outside clicks
  const { user, claims, logout } = useAuth(); // Destructures user, claims, and logout function from useAuth hook

  const t = useTranslations('Sidebar');
  // Memoize the isAdmin check to prevent unnecessary re-renders
  const isAdmin = useMemo(() => {
    return claims && claims.role === 'admin';
  }, [claims]);

  // Memoize the isAdmin check to prevent unnecessary re-renders
  const isNpoStaff = useMemo(() => {
    return claims && claims.role === 'npo-staff';
  }, [claims]);

  const isAmbassador = useMemo(() => {
    return claims && claims.role === 'ambassador';
  }, [claims]);

  const isMember = useMemo(() => {
    return claims && claims.role === 'member';
  }, [claims]);

  // Fetch logo URL from Firebase Storage
  useEffect(() => {
    const fetchLogoUrl = async () => {
      try {
        // Check if we have a cached URL
        const cachedUrl = localStorage.getItem('wannagonnaLogoUrl');
        const cachedTimestamp = localStorage.getItem('wannagonnaLogoTimestamp');
        
        // If we have a cached URL less than 24 hours old, use it
        if (cachedUrl && cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) < 24 * 60 * 60 * 1000) {
          setLogoUrl(cachedUrl);
          return;
        }

        const logoRef = ref(storage, 'logo/Favicon.png');
        const url = await getDownloadURL(logoRef);
        
        // Cache the URL and timestamp
        localStorage.setItem('wannagonnaLogoUrl', url);
        localStorage.setItem('wannagonnaLogoTimestamp', Date.now().toString());
        
        setLogoUrl(url);
      } catch (error) {
        console.error('Error fetching logo URL:', error);
        // If there's an error, try to use cached URL even if it's old
        const cachedUrl = localStorage.getItem('wannagonnaLogoUrl');
        if (cachedUrl) {
          setLogoUrl(cachedUrl);
        }
      }
    };
    fetchLogoUrl();
  }, []);

  // Function to toggle sidebar open/closed
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const router = useRouter();
  const handleNavigation = (path) => {
    router.push(path); // Navigate to the desired path
  };

  // Enhanced logout handler with error handling
  const handleLogout = async () => {
    try {
      // Close sidebar on mobile before logout
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      
      // Call the logout function from AuthContext
      await logout();
      
      // No need to redirect here as the AuthContext will handle it
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error during logout:', error);
      }
      
      // You could add a toast notification here if you have one
    }
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
          className='fixed top-4 left-4 z-50 inline-flex items-center p-2 text-sm text-primary-500 dark:text-primary-400 hover:text-white dark:hover:text-primary-100 rounded-lg sm:hidden hover:bg-gradient-to-r hover:from-primary-500 hover:to-primary-600 dark:hover:from-primary-600 dark:hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all duration-200 hover:scale-105 active:scale-95'
          style={{ marginLeft: '0' }}
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
        className={`fixed top-0 left-0 sm:z-10 z-40 w-64 h-screen transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:static sm:translate-x-0`}
        aria-label='Sidebar'
      >
        <Sidebar aria-label='Sidebar' className='bg-background-sidebar dark:bg-background-sidebar border-r border-border-light dark:border-border-dark'>
          {logoUrl ? (
            <Sidebar.Logo img={logoUrl} imgAlt='WannaGonna logo' className='text-text-primary dark:text-text-primary font-semibold'> 
              Wanna Gonna
            </Sidebar.Logo>
          ) : (
            <Sidebar.Logo className='text-text-primary dark:text-text-primary font-semibold'> 
              Wanna Gonna
            </Sidebar.Logo>
          )}
          <Sidebar.Items >
            <Sidebar.ItemGroup>
              <Sidebar.Item 
                onClick={() => handleLinkClick('/dashboard')} 
                icon={HiChartPie}
                className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'>
                {t('dashboard')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/activities')}
                icon={MdOutlineExplore}
                className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('explore')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/badges')}
                icon={LuFileBadge2}
                className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('badges')}
              </Sidebar.Item>
              {isAdmin && (<Sidebar.Item
                onClick={() => handleLinkClick('/leaderboard')}
                icon={MdOutlineLeaderboard }
                className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('leaderboard')}
              </Sidebar.Item>
              )}
              {isAdmin && (
                <Sidebar.Item
                  onClick={() => handleLinkClick('/myteam')}
                  icon={FaPeopleCarryBox}
                  className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                  {t('myteam')}
                </Sidebar.Item>
              )}
              {isNpoStaff && (
                <Sidebar.Item
                  onClick={() => handleLinkClick('/mynonprofit')}
                  icon={GoOrganization}
                  className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('mynonprofit')}
              </Sidebar.Item>
              )}
              <Sidebar.Item
                onClick={() => handleLinkClick('/members')}
                icon={RiTeamLine}
                className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('members')}
              </Sidebar.Item>
              </Sidebar.ItemGroup>
              <Sidebar.ItemGroup>
              {isAdmin && (
                <Sidebar.Item
                  onClick={() => handleLinkClick('/donate')}
                  icon={BiDonateHeart}
                  className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('donate')}
              </Sidebar.Item>
              )}

              <Sidebar.Item
                onClick={() => handleLinkClick('/settings')}
                icon={IoSettingsOutline}
                className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('settings')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/faq')}
                icon={HiQuestionMarkCircle}
                className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('faq')}
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleLinkClick('/feedback')}
                icon={HiLightBulb}
                className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('feedback')}
              </Sidebar.Item>
              {/* Only show Administration item if user has admin role */}
              {isAdmin && (
                <Sidebar.Item
                  onClick={() => handleLinkClick('/admin')}
                  icon={FaUserShield}
                  className='cursor-pointer text-text-primary dark:text-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
                >
                  Administration
                </Sidebar.Item>
              )}
            </Sidebar.ItemGroup>
            <Sidebar.ItemGroup>
            <Sidebar.Item
                onClick={() => {
                  handleNavigation('/login'); // Navigate to the login page
                  handleLogout(); // Call logout function
                }}
                icon={IoLogOut}
                className='cursor-pointer text-text-primary dark:text-text-primary hover:text-semantic-error-600 dark:hover:text-semantic-error-400 hover:bg-background-hover dark:hover:bg-background-hover transition-all duration-200 rounded-lg'
              >
                {t('logout')}
              </Sidebar.Item>
            </Sidebar.ItemGroup>
          </Sidebar.Items>
        </Sidebar>
      </aside>

      <div
        className={`z-100 transition-all duration-300 ${isSidebarOpen ? 'ml-30' : 'ml-0'} sm:ml-52`}
      >
      </div>
    </div>
  );
}