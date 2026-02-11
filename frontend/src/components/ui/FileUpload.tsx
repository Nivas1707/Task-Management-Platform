import { useState, useRef } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    maxSize?: number; // in bytes
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, accept = "*", maxSize = 5 * 1024 * 1024 }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const validateFiles = (files: File[]): File[] => {
        const validFiles: File[] = [];
        setError(null);

        for (const file of files) {
            if (file.size > maxSize) {
                setError(`File ${file.name} exceeds 5MB limit.`);
                continue;
            }
            validFiles.push(file);
        }
        return validFiles;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles = validateFiles(droppedFiles);

        if (validFiles.length > 0) {
            onFilesSelected(validFiles);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            const validFiles = validateFiles(selectedFiles);
            if (validFiles.length > 0) {
                onFilesSelected(validFiles);
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative group cursor-pointer
                    border-2 border-dashed rounded-xl p-8
                    transition-all duration-300 ease-in-out
                    flex flex-col items-center justify-center gap-4
                    ${isDragging
                        ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                        : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/5'
                    }
                `}
            >
                <div className={`
                    p-4 rounded-full transition-colors
                    ${isDragging ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 group-hover:text-indigo-400'}
                `}>
                    <Upload size={24} />
                </div>

                <div className="text-center">
                    <p className="text-white font-medium mb-1">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                        SVG, PNG, JPG or GIF (max. 5MB)
                    </p>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept={accept}
            />

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-400 text-sm mt-2 flex items-center gap-2"
                    >
                        <AlertCircle size={14} />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Import needed for AlertCircle
import { AlertCircle } from 'lucide-react';
