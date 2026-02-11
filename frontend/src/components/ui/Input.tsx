import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 
            text-white placeholder-gray-600 outline-none
            focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)]
            transition-all duration-300 backdrop-blur-sm
            ${icon ? 'pl-11' : ''}
            ${error ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && <span className="text-xs text-red-400 ml-1">{error}</span>}
        </div>
    );
};
