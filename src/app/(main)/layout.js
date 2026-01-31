'use client';

import Navbar from '@/components/layout/Sidebar'; // Navbar component for sidebar navigation
import Header from '@/components/layout/Header'; // Header component for header navigation
import ProtectedRoute from '@/utils/auth/ProtectedRoute';
import GlobalValidationModal from '@/components/activities/GlobalValidationModal';

const Layout = ({ children, isNavbarExpanded }) => {
    return (
        <ProtectedRoute>
            {/* min-h-dvh so layout fills viewport; no overflow-hidden so body scrolls (native pull-to-refresh) */}
            <div className="min-h-dvh pt-safe-top">
                <div className="fixed left-0 top-0 h-full z-50 pt-safe-top">
                    <Navbar />
                </div>
                <div className="fixed right-0 top-0 w-full z-40 pt-safe-top">
                    <Header />
                </div>
                {/* main is block flow so body scrolls when content is tall */}
                <main className={`pt-16 ${isNavbarExpanded ? 'ml-64' : 'ml-0'} sm:ml-64 relative z-0`}>
                    <div className="pr-4 pl-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-6">
                        {children}
                    </div>
                </main>
                {/* Global validation modal - appears on any page */}
                <GlobalValidationModal />
            </div>
        </ProtectedRoute>
    );
};

export default Layout;

