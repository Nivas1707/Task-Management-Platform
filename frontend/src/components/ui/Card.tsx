import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={hoverEffect ? { y: -5, boxShadow: '0 10px 40px -10px rgba(99,102,241,0.2)' } : {}}
            className={`
        bg-white dark:bg-[#111625]/70 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl p-6
        shadow-xl dark:shadow-none text-gray-900 dark:text-gray-100 ${className}
      `}
            {...props}
        >
            {children}
        </motion.div>
    );
};
