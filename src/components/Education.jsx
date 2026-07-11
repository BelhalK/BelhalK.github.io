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
                title="Academic Background"
                eyebrow="Education"
                subtitle="Degrees, research visits, and academic foundations."
            />

            <div className="space-y-6 relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-3 bottom-3 w-px bg-border -translate-x-1/2 hidden sm:block" />

                {education.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.1, 0.4), duration: 0.5 }}
                        className="relative sm:pl-12"
                    >
                        {/* Timeline dot */}
                        <div className="absolute left-6 top-7 -translate-x-1/2 h-4 w-4 rounded-full bg-primary ring-4 ring-background hidden sm:block" />

                        <div className="glass-card p-6 group">
                            <div className="flex items-center justify-between mb-4 gap-3">
                                <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary/10 text-primary">
                                    <GraduationCap size={22} />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                                    <Calendar size={12} />
                                    {item.date}
                                </div>
                            </div>

                            <h3 className="text-xl md:text-2xl font-display font-semibold mb-1.5 group-hover:text-primary transition-colors">
                                {item.institution}
                            </h3>
                            <p className="text-base font-medium text-primary mb-3">
                                {item.degree}
                            </p>
                            <p className="text-sm text-foreground/70 leading-relaxed">
                                {item.details}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Education;
