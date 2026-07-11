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
                        <div className="glass-card p-5 w-full flex flex-row items-center justify-between gap-4 relative overflow-hidden group">
                            <div className="flex items-center gap-4">
                                {/* Icon Box */}
                                <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary/10 text-primary shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                                    <BookOpen size={20} />
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

                            {/* Right: Institution Logos */}
                            {item.logos && item.logos.length > 0 && (
                                <div className="flex items-center gap-2 shrink-0">
                                    {item.logos.map((logoUrl, lIdx) => (
                                        <div key={lIdx} className="grid place-items-center h-10 w-10 rounded-xl bg-white border border-border p-1.5 shadow-sm shrink-0">
                                            <img 
                                                src={logoUrl} 
                                                alt="Institution Logo" 
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Teaching;
