import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export const DashboardLayout = () => {
    return (
        <div className="flex bg-[#0a0e17] min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
