import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const DashboardLayout = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex bg-gray-50 dark:bg-[#0a0e17] min-h-screen transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto relative">
                <button
                    onClick={toggleTheme}
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors z-50"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <Outlet />
            </main>
        </div>
    );
};
