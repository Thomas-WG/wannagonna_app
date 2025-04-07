'use client';

import Navbar from '@/components/Sidebar'; // Navbar component for sidebar navigation
import Header from '@/components/Header'; // Header component for header navigation
import { useAuth } from '@/hooks/useAuth'; // Hook for accessing user authentication status
import LoadingSpinner from '@/components/LoadingSpinner'; // Component to show the loading spinner

const Layout = ({ children, isNavbarExpanded }) => {

     // Destructure `user` and `loading` state from `useAuth` to manage access control
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

      // Display loading spinner while user authentication status is being determined
    if (loading)
    return (
    <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner />
    </div>
    );

    return (
        <div className="h-screen flex overflow-hidden">
            <div className="fixed left-0 top-0 h-full z-50">
                <Navbar />
            </div>
            <div className="flex-1 flex flex-col h-full">
                <div className="fixed right-0 top-0 w-full z-40">
                    <Header />
                </div>
                <main className={`flex-1 top-0 pt-16 h-full ${isNavbarExpanded ? 'ml-64' : 'ml-0'} sm:ml-64 overflow-y-auto relative z-0`}>
                    <div className='pr-4 pl-4'>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;

