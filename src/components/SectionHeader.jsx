import React from 'react';
import { motion } from 'framer-motion';

const SectionHeader = ({ title, subtitle, align = 'left' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`space-y-4 mb-12 pt-8 md:pt-0 ${align === 'center' ? 'text-center' : 'text-left'}`}
        >
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground relative inline-block">
                {title}
                <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-primary to-transparent rounded-full" />
            </h2>
            {subtitle && (
                <p className="text-lg text-muted-foreground md:whitespace-nowrap">
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
};

export default SectionHeader;
