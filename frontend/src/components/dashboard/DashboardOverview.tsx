import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Stats {
    totalTasks: number;
    tasksByStatus: { OPEN: number; IN_PROGRESS: number; DONE: number };
    tasksByPriority: { LOW: number; MEDIUM: number; HIGH: number };
}

export const DashboardOverview = ({ refreshTrigger }: { refreshTrigger?: number }) => {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/analytics/stats', { params: { _t: Date.now() } });
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            }
        };
        fetchStats();
    }, [refreshTrigger]);

    if (!stats) return <div className="text-white">Loading stats...</div>;

    const cards = [
        { label: 'Total Tasks', value: stats.totalTasks, icon: <Activity className="text-blue-400" />, color: 'from-blue-500/20 to-blue-600/5' },
        { label: 'Completed', value: stats.tasksByStatus.DONE || 0, icon: <CheckCircle className="text-green-400" />, color: 'from-green-500/20 to-green-600/5' },
        { label: 'In Progress', value: stats.tasksByStatus.IN_PROGRESS || 0, icon: <Clock className="text-yellow-400" />, color: 'from-yellow-500/20 to-yellow-600/5' },
        { label: 'High Priority', value: stats.tasksByPriority.HIGH || 0, icon: <AlertTriangle className="text-red-400" />, color: 'from-red-500/20 to-red-600/5' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <Card key={index} className={`relative overflow-hidden bg-gradient-to-br ${card.color}`}>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-medium">{card.label}</p>
                            <h3 className="text-3xl font-bold mt-1 text-white">{card.value}</h3>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                            {card.icon}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
