import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, Loader2, AlertCircle, Tag } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface BulkCreateTaskModalProps {
    onClose: () => void;
    onTasksCreated: () => void;
}

interface DraftTask {
    id: string; // temp id
    title: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    tags: string[];
}

export const BulkCreateTaskModal: React.FC<BulkCreateTaskModalProps> = ({ onClose, onTasksCreated }) => {
    const [tasks, setTasks] = useState<DraftTask[]>([]);
    const [currentTitle, setCurrentTitle] = useState('');
    const [currentPriority, setCurrentPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [currentTags, setCurrentTags] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const addTask = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!currentTitle.trim()) return;

        const newTask: DraftTask = {
            id: Math.random().toString(36).substr(2, 9),
            title: currentTitle.trim(),
            priority: currentPriority,
            tags: currentTags.split(',').map(t => t.trim()).filter(Boolean)
        };

        setTasks([...tasks, newTask]);
        setCurrentTitle('');
        setCurrentPriority('MEDIUM');
        setCurrentTags('');
    };

    const removeTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleSubmit = async () => {
        if (tasks.length === 0) return;
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            // Remove temp ids before sending
            const payload = tasks.map(({ id, ...rest }) => rest);
            const response = await api.post('/tasks/bulk', payload);
            setSuccess(`Successfully created ${tasks.length} tasks!`);
            onTasksCreated(); // Trigger refresh immediately
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err: any) {
            console.error('Bulk create failed', err);
            setError(err.response?.data?.message || err.message || "Failed to create tasks");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-[#111625] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Bulk Create Tasks</h2>
                            <p className="text-gray-400 text-sm">Add multiple tasks and create them at once.</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Input Area */}
                    <form onSubmit={addTask} className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
                        <div className="flex gap-3 mb-3">
                            <div className="flex-1">
                                <Input
                                    placeholder="Task Title (e.g., Update Database)"
                                    value={currentTitle}
                                    onChange={e => setCurrentTitle(e.target.value)}
                                    className="bg-black/20"
                                    autoFocus
                                />
                            </div>
                            <select
                                value={currentPriority}
                                onChange={e => setCurrentPriority(e.target.value as any)}
                                className="bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white outline-none focus:border-indigo-500 w-32"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <Input
                                    placeholder="Tags (comma separated)..."
                                    value={currentTags}
                                    onChange={e => setCurrentTags(e.target.value)}
                                    className="bg-black/20 pl-9"
                                />
                            </div>
                            <Button type="submit" variant="primary" disabled={!currentTitle.trim()} className="px-6">
                                <Plus size={18} /> Add
                            </Button>
                        </div>
                    </form>

                    {/* Task List Stack */}
                    <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 space-y-2 pr-2">
                        {tasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/10 rounded-xl p-8">
                                <div className="p-4 bg-white/5 rounded-full mb-3">
                                    <Plus size={24} className="opacity-50" />
                                </div>
                                <p>No tasks added yet.</p>
                                <p className="text-xs mt-1">Use the form above to add tasks to the stack.</p>
                            </div>
                        ) : (
                            tasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 group hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">{task.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    task.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                {task.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                                        <Tag size={10} /> {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeTask(task.id)}
                                        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-3 rounded border border-red-500/20 flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 text-green-400 text-sm bg-green-500/10 p-3 rounded border border-green-500/20 flex items-center gap-2">
                            <Check size={16} /> {success}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            isLoading={isLoading}
                            disabled={tasks.length === 0}
                            variant="primary"
                        >
                            Create {tasks.length} Tasks
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
