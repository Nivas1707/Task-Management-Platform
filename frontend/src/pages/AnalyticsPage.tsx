import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Download, Clock, CheckCircle2 } from 'lucide-react';

interface Stats {
    totalTasks: number;
    tasksByStatus: { OPEN: number; IN_PROGRESS: number; DONE: number };
    tasksByPriority: { LOW: number; MEDIUM: number; HIGH: number };
    avgCompletionTime: number;
    onTimeCompletionRate: number;
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

export const AnalyticsPage = () => {
    const [trends, setTrends] = useState<{ date: string; created: number; completed: number }[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trendsRes, statsRes] = await Promise.all([
                    api.get('/analytics/trends'),
                    api.get('/analytics/stats')
                ]);

                // Trends Data
                const trendsData = Object.entries(trendsRes.data.trends).map(([date, counts]: [string, any]) => ({
                    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    created: counts.created || 0,
                    completed: counts.completed || 0,
                })).reverse();
                setTrends(trendsData);

                // Stats Data
                setStats(statsRes.data);

            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived Data for Charts
    const priorityData = stats ? [
        { name: 'High', value: stats.tasksByPriority.HIGH || 0 },
        { name: 'Medium', value: stats.tasksByPriority.MEDIUM || 0 },
        { name: 'Low', value: stats.tasksByPriority.LOW || 0 },
    ].filter(item => item.value > 0) : [];

    const statusData = stats ? [
        { name: 'Open', value: stats.tasksByStatus.OPEN || 0 },
        { name: 'In Progress', value: stats.tasksByStatus.IN_PROGRESS || 0 },
        { name: 'Done', value: stats.tasksByStatus.DONE || 0 },
    ] : [];

    // Calculate Productivity Score (Weighted)
    // High Priority = 3 pts, Medium = 2 pts, Low = 1 pt
    // Score = (Weighted Completed / Weighted Total) * 100
    // Calculate Productivity Score (Weighted)
    // 1. Completion Rate (Weight: 40%)
    // 2. Task Volume (Weight: 40%) - Up to 20 tasks treated as 100% volume score
    // 3. High Priority Bonus (Weight: 20%) - % of completed tasks that are HIGH priority
    const calculateProductivityScore = () => {
        if (!stats) return 0;
        if (stats.totalTasks === 0) return 0;

        // 1. Completion Rate
        const done = stats.tasksByStatus.DONE || 0;
        const total = stats.totalTasks;
        const completionRate = (done / total) * 100;

        // 2. Volume Score (Logarithmic-ish scale, capped at 20 tasks for max points)
        // If you have 20+ tasks, you get full volume points.
        const volumeScore = Math.min(total, 20) * 5; // 20 * 5 = 100

        // 3. High Priority Bonus
        // Of the tasks done, how many were high priority?
        // We don't have exact "High priority AND Done" count from this aggregated stats object 
        // purely, but we can approximate or just use High Priority count as a proxy for "taking on hard stuff"
        // Let's use ratio of High Priority tasks in total work.
        const highPriorityRate = total > 0 ? (stats.tasksByPriority.HIGH / total) * 100 : 0;

        // Weighted Calculation
        const weightedScore = (
            (completionRate * 0.4) +
            (volumeScore * 0.4) +
            (highPriorityRate * 0.2)
        );

        return Math.round(weightedScore);
    };

    const productivityScore = calculateProductivityScore();
    // Keep completion rate separate for the specific card
    const completionRate = stats && stats.totalTasks > 0
        ? Math.round(((stats.tasksByStatus.DONE || 0) / stats.totalTasks) * 100)
        : 0;

    // Export Data Handler
    const handleExport = async () => {
        try {
            // Fetch all tasks for export (using high limit)
            const response = await api.get('/tasks', {
                params: { limit: 1000, page: 1 }
            });

            // Backend returns { data: [], meta: {} }, so accessing response.data.data
            const tasks = response.data.data;

            if (!Array.isArray(tasks)) {
                console.error('Unexpected response format:', response.data);
                alert('Export failed: Unexpected data format.');
                return;
            }

            // Convert to CSV
            const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Created At'];
            const csvContent = [
                headers.join(','),
                ...tasks.map((t: any) => [
                    `"${t.title.replace(/"/g, '""')}"`,
                    t.status,
                    t.priority,
                    t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
                    new Date(t.createdAt).toLocaleDateString()
                ].join(','))
            ].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to export data', error);
            alert('Failed to export data. Please try again.');
        }
    };

    if (loading) return <div className="text-white p-8 text-center">Loading analytics...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Deep dive into your productivity metrics.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                    <Download size={18} />
                    Export Data
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-900/40 to-indigo-900/10 border-indigo-500/20">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Tasks</h3>
                    <p className="text-3xl font-bold text-white mt-1">{stats?.totalTasks || 0}</p>
                </Card>
                <Card className="bg-gradient-to-br from-purple-900/40 to-purple-900/10 border-purple-500/20">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Completed</h3>
                    <p className="text-3xl font-bold text-white mt-1">{stats?.tasksByStatus.DONE || 0}</p>
                </Card>
                <Card className="bg-gradient-to-br from-pink-900/40 to-pink-900/10 border-pink-500/20">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Completion Rate</h3>
                    <p className="text-3xl font-bold text-white mt-1">{completionRate}%</p>
                </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-indigo-400" />
                        Avg Completion Time
                    </h3>
                    <p className="text-3xl font-bold text-white mt-1">
                        {stats?.avgCompletionTime
                            ? `${(stats.avgCompletionTime / (1000 * 60 * 60)).toFixed(1)} hrs`
                            : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Average time from creation to completion</p>
                </Card>
                <Card className="bg-white/5 border-white/10">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-400" />
                        On-Time Completion Rate
                    </h3>
                    <p className="text-3xl font-bold text-white mt-1">
                        {stats?.onTimeCompletionRate !== undefined
                            ? `${Math.round(stats.onTimeCompletionRate)}%`
                            : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tasks completed before due date</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trends Chart */}
                <Card className="min-h-[400px]">
                    <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                        Activity Trend <span className="text-sm font-normal text-gray-500">(Last 7 Days)</span>
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends}>
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Line
                                    name="Created"
                                    type="monotone"
                                    dataKey="created"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                />
                                <Line
                                    name="Completed"
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Productivity Score / Completion Gauge */}
                <Card className="min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
                    <h3 className="text-xl font-bold mb-8 text-white relative z-10 self-start w-full">Productivity Score</h3>

                    <div className="relative w-56 h-56 rounded-full flex items-center justify-center z-10">
                        {/* Outer Glow */}
                        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />

                        {/* Circular Progress (Simplified with raw SVG/CSS for verify) */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="50%" cy="50%" r="45%"
                                fill="none" stroke="#334155" strokeWidth="12"
                            />
                            <circle
                                cx="50%" cy="50%" r="45%"
                                fill="none" stroke="#6366f1" strokeWidth="12"
                                strokeDasharray="283"
                                strokeDashoffset={283 - (283 * productivityScore) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-6xl font-bold text-white tracking-tighter">{productivityScore}</span>
                            <span className="text-sm text-indigo-300 uppercase tracking-widest mt-1">Score</span>
                        </div>
                    </div>
                </Card>

                {/* Priority Breakdown (Pie) */}
                <Card className="min-h-[400px]">
                    <h3 className="text-xl font-bold mb-6 text-white">Task Priority Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={priorityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {priorityData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Status Breakdown (Bar) */}
                <Card className="min-h-[400px]">
                    <h3 className="text-xl font-bold mb-6 text-white">Tasks by Status</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                    {statusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};
