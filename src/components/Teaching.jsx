import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { teaching } from '../data/teaching';
import { BookOpen } from 'lucide-react';
import SectionHeader from './SectionHeader';

const Teaching = () => {
    const reduce = useReducedMotion();
    return (
        <section>
            <SectionHeader
                title="Teaching"
                eyebrow="Academic"
                subtitle="University courses, graduate programs, and executive education."
            />

            <div className="grid gap-4 md:grid-cols-2">
                {teaching.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.07, 0.35), duration: 0.45 }}
                        className="glass-card p-6 group"
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <BookOpen className="text-primary group-hover:scale-110 transition-transform" size={20} />
                            <h3 className="text-sm font-mono uppercase tracking-wide text-foreground/65 group-hover:text-primary transition-colors">
                                {item.role}
                            </h3>
                        </div>
                        <p className="text-lg md:text-xl font-display font-semibold text-foreground leading-tight">
                            {item.course}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Teaching;
