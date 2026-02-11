import { useState, useCallback } from 'react';
import { DashboardOverview } from '../../components/dashboard/DashboardOverview';
import { TaskList } from '../../components/dashboard/TaskList';

export const DashboardPage = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleTaskUpdate = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                    Dashboard
                </h1>
                <p className="text-gray-400 mt-1">Overview of your productivity</p>
            </div>

            <DashboardOverview refreshTrigger={refreshTrigger} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <TaskList onTaskUpdate={handleTaskUpdate} />
                </div>
                <div className="lg:col-span-1">
                    {/* Recent Activity or Analytics Chart Placeholder */}
                    <div className="bg-[#111625]/50 rounded-2xl p-6 border border-white/5 h-full min-h-[300px]">
                        <h3 className="text-xl font-bold mb-4">Trending</h3>
                        <div className="flex items-center justify-center h-[200px] text-gray-500">
                            Chart Component Here
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
