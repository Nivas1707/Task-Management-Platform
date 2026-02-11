import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CreateTaskModalProps {
    onClose: () => void;
    onTaskCreated: () => void;
}

interface User {
    id: string;
    name: string;
    email: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onTaskCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const [tags, setTags] = useState('');
    const [assignedToId, setAssignedToId] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/auth/users');
                setUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch users', error);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            await api.post('/tasks', {
                title,
                description,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                tags: tagList,
                assignedToId: assignedToId || undefined
            });
            onTaskCreated();
            onClose();
        } catch (error: any) {
            console.error('Failed to create task', error);
            setError(error.response?.data?.message || 'Failed to create task. Please try again.');
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
                    className="bg-[#111625] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">New Task</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Title"
                            placeholder="e.g. Redesign Homepage"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />

                        <div>
                            <label className="text-sm font-medium text-gray-300 ml-1 mb-2 block">Description</label>
                            <textarea
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-all resize-none h-24"
                                placeholder="Add details..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-300 ml-1 mb-2 block">Priority</label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value as any)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300 ml-1 mb-2 block">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-300 ml-1 mb-2 block">Tags (comma separated)</label>
                            <Input
                                placeholder="e.g. design, urgent, frontend"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-300 ml-1 mb-2 block">Assign To</label>
                            <select
                                value={assignedToId}
                                onChange={e => setAssignedToId(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50"
                            >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
                            Create Task
                        </Button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
