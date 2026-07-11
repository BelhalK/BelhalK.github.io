import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const SectionHeader = ({ title, subtitle, eyebrow, align = 'left', subtitleClassName = '' }) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`mb-10 md:mb-14 ${align === 'center' ? 'text-center' : 'text-left'}`}
        >
            {eyebrow && (
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3 invisible select-none">{eyebrow}</p>
            )}
            <h2 className="font-display font-semibold tracking-tight text-foreground text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] relative inline-block">
                {title}
                <span className="absolute -bottom-1 left-0 h-[3px] w-16 rounded-full bg-gradient-to-r from-primary to-transparent" />
            </h2>
            {subtitle && (
                <p className={`mt-4 text-base md:text-lg text-foreground/65 max-w-2xl leading-relaxed ${subtitleClassName}`}>
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
};

export default SectionHeader;
