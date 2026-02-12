import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    CheckSquare,
    BarChart2,
    LogOut,
    User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export const Sidebar = () => {
    const { logout, user } = useAuth();

    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/dashboard' },
        { icon: <CheckSquare size={20} />, label: 'Tasks', path: '/tasks' },
        { icon: <BarChart2 size={20} />, label: 'Analytics', path: '/analytics' },
        // { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
    ];

    return (
        <motion.aside
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            className="w-64 min-h-screen bg-white/80 dark:bg-[#111625]/50 backdrop-blur-xl border-r border-gray-200 dark:border-white/5 flex flex-col fixed left-0 top-0 z-50 transition-colors duration-300"
        >
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-white">
                    T
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                    TaskFuture
                </span>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${isActive
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-indigo-200 dark:border-indigo-500/20'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}
            `}
                    >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                        {user?.name?.charAt(0) || <User size={14} />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </motion.aside>
    );
};
