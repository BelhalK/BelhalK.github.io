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
                        <div className="absolute left-6 top-[28px] -translate-x-1/2 h-4 w-4 rounded-full bg-primary ring-4 ring-background hidden sm:block" />

                        <div className="glass-card p-4 group flex items-start gap-4">
                            <div className="grid place-items-center h-10 w-10 rounded-xl bg-white border border-border shrink-0 shadow-sm overflow-hidden">
                                {item.logo ? (
                                    <img
                                        src={item.logo}
                                        alt={`${item.institution} logo`}
                                        loading="lazy"
                                        className={`w-full h-full object-contain ${
                                            item.institution === 'Ecole Polytechnique' ? 'p-1.5' : 'p-0.5'
                                        }`}
                                    />
                                ) : (
                                    <div className="grid place-items-center h-full w-full bg-primary/10 text-primary rounded-lg">
                                        <GraduationCap size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-1">
                                    <h3 className="text-lg font-display font-semibold group-hover:text-primary transition-colors leading-tight">
                                        {item.institution}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full w-fit shrink-0">
                                        <Calendar size={10} />
                                        {item.date}
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-primary mb-1">
                                    {item.degree}
                                </p>
                                <p className="text-xs md:text-sm text-foreground/70 leading-relaxed">
                                    {item.details}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Education;
