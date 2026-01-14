'use client';

import Navbar from '@/components/layout/Sidebar'; // Navbar component for sidebar navigation
import Header from '@/components/layout/Header'; // Header component for header navigation
import ProtectedRoute from '@/utils/auth/ProtectedRoute';
import GlobalValidationModal from '@/components/activities/GlobalValidationModal';

const Layout = ({ children, isNavbarExpanded }) => {
    return (
        <ProtectedRoute>
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
                {/* Global validation modal - appears on any page */}
                <GlobalValidationModal />
            </div>
        </ProtectedRoute>
    );
};

export default Layout;

