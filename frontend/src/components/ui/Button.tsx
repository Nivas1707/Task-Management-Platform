import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    ...props
}) => {
    const baseStyles = "relative px-6 py-3 rounded-xl font-medium transition-all duration-300 overflow-hidden group";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-500/50",
        secondary: "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/10",
        danger: "bg-red-500/80 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]",
        ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                </span>
            ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {children as React.ReactNode}
                </span>
            )}
            {/* Glow effect on hover */}
            <div className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </motion.button>
    );
};
