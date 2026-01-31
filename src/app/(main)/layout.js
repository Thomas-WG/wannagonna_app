'use client';

import Navbar from '@/components/layout/Sidebar'; // Navbar component for sidebar navigation
import Header from '@/components/layout/Header'; // Header component for header navigation
import ProtectedRoute from '@/utils/auth/ProtectedRoute';
import GlobalValidationModal from '@/components/activities/GlobalValidationModal';

const Layout = ({ children, isNavbarExpanded }) => {
    return (
        <ProtectedRoute>
            <div className="h-dvh flex overflow-hidden pt-safe-top">
                <div className="fixed left-0 top-0 h-full z-50 pt-safe-top">
                    <Navbar />
                </div>
                <div className="flex-1 flex flex-col h-full">
                    <div className="fixed right-0 top-0 w-full z-40 pt-safe-top">
                        <Header />
                    </div>
                    <main className={`flex-1 top-0 pt-16 h-full ${isNavbarExpanded ? 'ml-64' : 'ml-0'} sm:ml-64 overflow-y-auto relative z-0 scroll-touch`}>
                        <div className="pr-4 pl-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-6">
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

