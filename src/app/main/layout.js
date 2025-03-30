import Navbar from '@/components/Sidebar'; // Navbar component for sidebar navigation

const Layout = ({ children, isNavbarExpanded }) => {
    return (
        <div className="relative flex">
            <div className="fixed left-0 top-0 h-full z-10">
                <Navbar />
            </div>
            <main className={`overflow-y-auto ${isNavbarExpanded ? 'ml-64' : 'ml-16'} sm:ml-64`}>
                {children}
            </main>
        </div>
    );
};

export default Layout;

