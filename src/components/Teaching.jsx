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

            <div className="flex flex-col gap-4">
                {teaching.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        <div className="glass-card p-5 w-full flex items-center gap-4 relative overflow-hidden group">
                            
                            {/* Icon Box */}
                            <div className="grid place-items-center h-12 w-12 rounded-xl bg-white border border-border p-2.5 shrink-0 transition-transform group-hover:scale-105 overflow-hidden shadow-sm">
                                {item.logo ? (
                                    <img 
                                        src={item.logo} 
                                        alt="School Logo" 
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <BookOpen size={20} className="text-primary" />
                                )}
                            </div>

                            {/* Details */}
                            <div>
                                <h3 className="text-lg md:text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                                    {item.course}
                                </h3>
                                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mt-1">
                                    {item.role}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Teaching;
