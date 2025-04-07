import Navbar from '@/components/Sidebar'; // Navbar component for sidebar navigation
import Header from '@/components/Header'; // Header component for header navigation

const Layout = ({ children, isNavbarExpanded }) => {
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
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;

