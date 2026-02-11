import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen, onClose, onConfirm, title, message,
    confirmText = "Confirm", cancelText = "Cancel", isDestructive = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1e293b] border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-full ${isDestructive ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>

                    <p className="text-gray-400 mb-6">{message}</p>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>
                            {cancelText}
                        </Button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDestructive
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
