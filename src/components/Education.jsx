import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { education } from '../data/education';
import { GraduationCap, Calendar } from 'lucide-react';
import SectionHeader from './SectionHeader';

const Education = () => {
    const reduce = useReducedMotion();
    return (
        <section>
            <SectionHeader
                title="Education"
                eyebrow="Academic Background"
                subtitle="Degrees, research visits, and academic foundations."
            />

            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                {education.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.35), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        <div className="glass-card p-5 w-full flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group">
                            
                            {/* Icon & School & Degree */}
                            <div className="flex items-start gap-4 min-w-[280px] shrink-0">
                                <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary/10 text-primary shrink-0 transition-transform group-hover:scale-105 mt-0.5">
                                    <GraduationCap size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                                        {item.institution}
                                    </h3>
                                    <p className="text-xs font-mono text-primary font-semibold tracking-wide mt-1">
                                        {item.degree}
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 md:px-2">
                                <p className="text-sm text-foreground/70 leading-relaxed">
                                    {item.details}
                                </p>
                            </div>

                            {/* Date */}
                            <div className="shrink-0 self-start md:self-center">
                                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full whitespace-nowrap">
                                    <Calendar size={12} className="text-primary" />
                                    {item.date}
                                </div>
                            </div>

                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Education;
