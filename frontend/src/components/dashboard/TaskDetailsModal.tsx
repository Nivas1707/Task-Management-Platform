import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Trash2, Download, Edit2, Save, FileText, Calendar, Tag, User as UserIcon, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { FileUpload } from '../ui/FileUpload';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface TaskDetailsModalProps {
    taskId: string | null;
    onClose: () => void;
    onUpdate: () => void;
}

interface AttachedFile {
    id: string;
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
}

interface User {
    id: string;
    name: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: User;
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string | null;
    tags: string[];
    assignedTo: User | null;
}

export const TaskDetailsModal = ({ taskId, onClose, onUpdate }: TaskDetailsModalProps) => {
    const { user } = useAuth();
    const [task, setTask] = useState<Task | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [files, setFiles] = useState<AttachedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [editTaskData, setEditTaskData] = useState<Partial<Task>>({});

    // Comment Editing State
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        if (taskId) {
            fetchTaskDetails();
        }
    }, [taskId]);

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tasks/${taskId}`);
            setTask(res.data);
            setComments(res.data.comments || []);
            setFiles(res.data.files || []);
            setEditTaskData(res.data);
        } catch (error) {
            console.error('Failed to fetch task details', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        const tempId = Date.now().toString();
        const optimisticComment: Comment = {
            id: tempId,
            content: newComment,
            createdAt: new Date().toISOString(),
            user: { id: user?.id || '', name: user?.name || 'You' }
        };

        setComments(prev => [...prev, optimisticComment]);
        setNewComment('');

        try {
            await api.post('/comments', { content: optimisticComment.content, taskId });
            // Ideally replace the temp comment with the real one, but fetching details ensures consistency
            fetchTaskDetails();
        } catch (error) {
            console.error('Failed to add comment', error);
            // Rollback
            setComments(prev => prev.filter(c => c.id !== tempId));
            setNewComment(optimisticComment.content); // Restore input
            alert('Failed to add comment');
        }
    };

    const handleUpdateComment = async (commentId: string) => {
        if (!editContent.trim()) return;
        try {
            await api.put(`/comments/${commentId}`, { content: editContent });
            setEditingCommentId(null);
            fetchTaskDetails();
        } catch (error) {
            console.error('Failed to update comment', error);
            alert('Failed to update comment');
        }
    };

    const handleDeleteComment = (commentId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Comment',
            message: 'Are you sure you want to delete this comment? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/comments/${commentId}`);
                    fetchTaskDetails();
                } catch (error) {
                    console.error('Failed to delete comment', error);
                    alert('Failed to delete comment');
                }
            }
        });
    };

    const handleFileUpload = async (selectedFiles: File[]) => {
        const formData = new FormData();
        if (taskId) {
            formData.append('taskId', taskId);
        }

        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchTaskDetails();
        } catch (error) {
            console.error('Failed to upload files', error);
            alert('Failed to upload files');
        }
    };

    const handleDeleteFile = (fileId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete File',
            message: 'Are you sure you want to delete this file? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete(`/files/${fileId}`);
                    fetchTaskDetails();
                } catch (error) {
                    console.error('Failed to delete file', error);
                    alert('Failed to delete file');
                }
            }
        });
    };

    const handleDownload = async (file: AttachedFile) => {
        try {
            const response = await api.get(`/files/${file.id}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.originalName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Download failed', error);
            alert('Failed to download file');
        }
    };

    const handleSaveTask = async () => {
        try {
            const payload = {
                title: editTaskData.title,
                description: editTaskData.description,
                status: editTaskData.status,
                priority: editTaskData.priority,
                dueDate: editTaskData.dueDate,
                tags: editTaskData.tags,
                assignedToId: editTaskData.assignedTo?.id // Ensure this maps correctly if assignedTo is an object
            };

            // If assignedTo is just an ID in editTaskData, handle that too
            // But based on interface, assignedTo is User | null. 
            // The backend expects assignedToId.
            // We need to check how setEditTaskData overrides this or if we need to map it.

            // Actually, let's just pick what we need.
            // If editTaskData has assignedToId directly (it might from the form), use it.
            // The Task interface has assignedTo: User. 
            // We might need to handle the assignedTo selection separately or ensure editTaskData has assignedToId.
            // For now, let's just send the text fields and status/priority which seem to be the main things edited.

            const cleanPayload = {
                title: editTaskData.title,
                description: editTaskData.description,
                status: editTaskData.status,
                priority: editTaskData.priority,
                // Handle empty string for date inputs by converting to null
                dueDate: editTaskData.dueDate ? editTaskData.dueDate : null,
                tags: editTaskData.tags
                // assignedToId: ... (User selection might need specific handling if the UI supports it)
            };

            await api.patch(`/tasks/${taskId}`, cleanPayload);
            setIsEditingTask(false);
            onUpdate();
            fetchTaskDetails();
        } catch (error) {
            console.error('Failed to update task', error);
        }
    };

    if (!taskId) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end"
                onClick={onClose}
            >
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-full max-w-2xl bg-[#0f111a] h-full shadow-2xl overflow-hidden flex flex-col border-l border-white/10"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#161b22]">
                        <div className="flex-1">
                            {isEditingTask ? (
                                <Input
                                    value={editTaskData.title || ''}
                                    onChange={e => setEditTaskData({ ...editTaskData, title: e.target.value })}
                                    className="text-xl font-bold bg-transparent border-none p-0 focus:ring-0"
                                />
                            ) : (
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    {task?.title}
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${task?.priority === 'HIGH' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        task?.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                        }`}>
                                        {task?.priority}
                                    </span>
                                </h2>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditingTask ? (
                                <button onClick={handleSaveTask} className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                                    <Save size={18} />
                                </button>
                            ) : (
                                <button onClick={() => setIsEditingTask(true)} className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors">
                                    <Edit2 size={18} />
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div></div>
                        ) : (
                            <>
                                {/* Properties Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5"><Tag size={12} /> Status</p>
                                        {isEditingTask ? (
                                            <select
                                                value={editTaskData.status}
                                                onChange={e => setEditTaskData({ ...editTaskData, status: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
                                            >
                                                <option value="OPEN">Open</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="DONE">Done</option>
                                            </select>
                                        ) : (
                                            <p className="text-sm text-white">{task?.status.replace('_', ' ')}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} /> Due Date</p>
                                        {isEditingTask ? (
                                            <Input
                                                type="date"
                                                value={editTaskData.dueDate ? new Date(editTaskData.dueDate).toISOString().split('T')[0] : ''}
                                                onChange={e => setEditTaskData({ ...editTaskData, dueDate: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
                                            />
                                        ) : (
                                            <p className="text-sm text-white">{task?.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5"><UserIcon size={12} /> Assignee</p>
                                        <p className="text-sm text-white">{task?.assignedTo?.name || 'Unassigned'}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><FileText size={14} /> Description</h3>
                                    {isEditingTask ? (
                                        <textarea
                                            value={editTaskData.description || ''}
                                            onChange={e => setEditTaskData({ ...editTaskData, description: e.target.value })}
                                            className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-indigo-500/50 resize-none"
                                            placeholder="Add a description..."
                                        />
                                    ) : (
                                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{task?.description || 'No description provided.'}</p>
                                    )}
                                </div>

                                {/* Files Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Attachments</h3>
                                    </div>

                                    <div className="mb-4">
                                        <FileUpload
                                            onFilesSelected={handleFileUpload}
                                            accept=".jpg,.png,.pdf,.doc,.docx,.txt"
                                        />
                                    </div>

                                    {files.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No files attached.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {files.map(file => (
                                                <div key={file.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-2 bg-indigo-500/20 rounded text-indigo-400"><Paperclip size={16} /></div>
                                                        <div className="truncate">
                                                            <p className="text-sm text-white truncate">{file.originalName}</p>
                                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleDownload(file)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded">
                                                            <Download size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteFile(file.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Comments Section */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Comments</h3>
                                    <div className="space-y-4 mb-6">
                                        {comments.length === 0 && <p className="text-sm text-gray-500 italic">No comments yet.</p>}
                                        {comments.map(comment => (
                                            <div key={comment.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {comment.user.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-white/5 rounded-xl rounded-tl-none p-3 border border-white/5 relative group">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="text-xs font-bold text-gray-300">{comment.user.name}</span>
                                                            <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>

                                                        {editingCommentId === comment.id ? (
                                                            <div className="mt-2">
                                                                <textarea
                                                                    value={editContent}
                                                                    onChange={e => setEditContent(e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none resize-none mb-2"
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                                                                    <button onClick={() => handleUpdateComment(comment.id)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                                                        <Save size={12} /> Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-gray-300 prose prose-invert max-w-none">
                                                                <ReactMarkdown components={{
                                                                    p: ({ node, ...props }) => <p className="mb-1" {...props} />,
                                                                    a: ({ node, ...props }) => <a className="text-indigo-400 hover:underline" target="_blank" {...props} />
                                                                }}>{comment.content}</ReactMarkdown>
                                                            </div>
                                                        )}

                                                        {user?.id === comment.user.id && !editingCommentId && (
                                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingCommentId(comment.id);
                                                                        setEditContent(comment.content);
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-white"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    className="p-1 text-gray-400 hover:text-red-400"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Comment */}
                                    <div className="flex gap-2 items-center bg-white/5 p-2 rounded-full border border-white/10 focus-within:border-indigo-500/50 transition-colors">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                            placeholder="Write a comment..."
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white px-4 placeholder-gray-500"
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            className="p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            disabled={!newComment.trim()}
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 ml-4">
                                        * Markdown supported (e.g., **bold**, *italic*, [link](url))
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Confirmation Modal */}
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                />
            </motion.div>
        </AnimatePresence>
    );
};
