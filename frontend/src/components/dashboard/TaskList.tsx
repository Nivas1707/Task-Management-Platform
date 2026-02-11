import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Check, Clock, AlertCircle, Hash, User as UserIcon, Trash2, Search, ArrowUpDown, FileStack, RefreshCw, ClipboardList } from 'lucide-react';
import { TaskDetailsModal } from './TaskDetailsModal';
import { CreateTaskModal } from './CreateTaskModal';
import { BulkCreateTaskModal } from './BulkCreateTaskModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

interface Task {
    id: string;
    title: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    tags: string[];
    assignedTo?: { id: string, name: string, email: string };
}

interface TaskListProps {
    onTaskUpdate?: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({ onTaskUpdate }) => {
    // ... (state hooks remain same)
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState('ALL');
    const [sort, setSort] = useState('newest');
    const [search, setSearch] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Confirmation State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        action: () => { },
        isDestructive: false
    });

    // Socket Connection
    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('task:created', (newTask: Task) => {
            console.log('Socket: Task created', newTask);
            // Optionally add to list immediately or just refresh
            fetchTasks(true);
        });

        socket.on('task:updated', (updatedTask: Task) => {
            console.log('Socket: Task updated', updatedTask);
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
        });

        socket.on('task:deleted', ({ id }: { id: string }) => {
            console.log('Socket: Task deleted', id);
            setTasks(prev => prev.filter(t => t.id !== id));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Refresh list handler
    const fetchTasks = async (reset = false) => {
        if (isLoading && !reset) return;
        setIsLoading(true);
        try {
            const params: any = {
                page: reset ? 1 : page,
                limit: 10,
                sortBy: sort === 'priority' ? 'priority' : 'createdAt',
                order: sort === 'oldest' ? 'asc' : 'desc',
                _t: Date.now() // Cache busting
            };

            if (filter !== 'ALL') params.status = filter;
            if (search.trim()) params.search = search;

            // console.log('Fetching tasks...', { reset, params });

            const response = await api.get('/tasks', { params });
            const newTasks = response.data.data;
            const meta = response.data.meta;

            // console.log('Fetched tasks:', newTasks.length, 'Total:', meta.total);

            if (reset) {
                setTasks(newTasks);
            } else {
                setTasks(prev => {
                    // Prevent duplicates
                    const existingIds = new Set(prev.map(t => t.id));
                    const uniqueNewTasks = newTasks.filter((t: Task) => !existingIds.has(t.id));
                    return [...prev, ...uniqueNewTasks];
                });
            }

            setHasMore(meta.page < meta.totalPages);
            setPage(prev => reset ? 2 : prev + 1);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTasks(true);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filter, sort, search]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'IN_PROGRESS': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'text-red-400';
            case 'MEDIUM': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const handleToggleStatus = async (taskId: string, currentStatus: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = currentStatus === 'DONE' ? 'OPEN' : 'DONE';
        try {
            await api.patch(`/tasks/${taskId}`, { status: newStatus });
            setTasks(tasks.map(t =>
                t.id === taskId ? { ...t, status: newStatus as any } : t
            ));
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            console.error('Failed to update task status', error);
        }
    };

    const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
            if (onTaskUpdate) onTaskUpdate();
        } catch (error) {
            console.error('Failed to delete task', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold">Tasks</h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="secondary"
                        className="py-2 px-3 text-sm flex-none"
                        onClick={() => fetchTasks(true)}
                        title="Refresh List"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                    <Button
                        variant="secondary"
                        className="py-2 px-4 text-sm flex-1 md:flex-none"
                        onClick={() => setIsBulkCreateModalOpen(true)}
                    >
                        <FileStack size={16} /> Bulk Create
                    </Button>
                    <Button
                        variant="primary"
                        className="py-2 px-4 text-sm flex-1 md:flex-none"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus size={16} /> New Task
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                    {/* Filters */}
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                        {['ALL', 'OPEN', 'IN_PROGRESS', 'DONE'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={16} className="text-gray-400" />
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="priority">Priority</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {tasks.map((task) => (
                    <Card
                        key={task.id}
                        hoverEffect
                        className="flex items-center justify-between p-4 group cursor-pointer"
                        onClick={() => setSelectedTaskId(task.id)}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`p-2 rounded-full border transition-colors hover:bg-white/10 ${task.status === 'DONE' ? 'bg-green-500/20 border-green-500' : 'border-gray-600'}`}
                                onClick={(e) => handleToggleStatus(task.id, task.status, e)}
                            >
                                <Check size={16} className={task.status === 'DONE' ? 'text-green-500' : 'text-transparent'} />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${task.status === 'DONE' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                    {task.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                                    <span className={`px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                    <span className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                        <AlertCircle size={12} /> {task.priority}
                                    </span>
                                    {task.dueDate && (
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    {task.assignedTo && (
                                        <span className="text-gray-400 flex items-center gap-1" title={`Assigned to ${task.assignedTo.name}`}>
                                            <UserIcon size={12} /> {task.assignedTo.name}
                                        </span>
                                    )}
                                    {task.tags && task.tags.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            {task.tags.map(tag => (
                                                <span key={tag} className="flex items-center gap-0.5 text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                                                    <Hash size={10} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </Card>
                ))}

                {/* Empty State */}
                {tasks.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                        <div className="bg-indigo-500/10 p-4 rounded-full mb-4">
                            <ClipboardList size={48} className="text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {search ? 'No tasks found' : 'You are all caught up!'}
                        </h3>
                        <p className="text-gray-400 max-w-sm mb-6">
                            {search
                                ? `We couldn't find any tasks matching "${search}". Try adjusting your filters.`
                                : "Create a new task to get started on your journey to productivity."}
                        </p>
                        {!search && (
                            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus size={18} className="mr-2" />
                                Create Task
                            </Button>
                        )}
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {hasMore && !isLoading && tasks.length > 0 && (
                    <div className="flex justify-center pt-2">
                        <Button
                            variant="primary"
                            className="bg-white/5 hover:bg-white/10 text-white border-0"
                            onClick={() => fetchTasks()}
                        >
                            Load More
                        </Button>
                    </div>
                )}
            </div>

            {selectedTaskId && (
                <TaskDetailsModal
                    taskId={selectedTaskId}
                    onClose={() => {
                        setSelectedTaskId(null);
                        fetchTasks(true);
                    }}
                    onUpdate={() => fetchTasks(true)}
                />
            )}

            {isCreateModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={() => {
                        fetchTasks(true);
                        if (onTaskUpdate) onTaskUpdate();
                    }}
                />
            )}

            {isBulkCreateModalOpen && (
                <BulkCreateTaskModal
                    onClose={() => setIsBulkCreateModalOpen(false)}
                    onTasksCreated={() => {
                        fetchTasks(true);
                        if (onTaskUpdate) onTaskUpdate();
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.action}
                title={confirmModal.title}
                message={confirmModal.message}
                isDestructive={confirmModal.isDestructive}
            />
        </div>
    );
};
