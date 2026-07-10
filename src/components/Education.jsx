import React from 'react';
import { motion } from 'framer-motion';
import { education } from '../data/education';
import { GraduationCap, Calendar } from 'lucide-react';
import SectionHeader from './SectionHeader';

const Education = () => {
    return (
        <section>
            <SectionHeader
                title="Education"
                subtitle="Academic background and degrees."
            />

            <div className="space-y-8 relative">
                {/* Timeline Line */}
                <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-px bg-white/10 -translate-x-1/2 hidden md:block" />

                {education.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className={`relative flex flex-col md:flex-row gap-8 items-start ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                    >
                        {/* Timeline Dot */}
                        <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-primary rounded-full -translate-x-1/2 mt-6 ring-4 ring-background hidden md:block" />

                        <div className="w-full md:w-[calc(50%-2rem)]">
                            <div className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded">
                                        <Calendar size={12} />
                                        {item.date}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-display font-bold mb-2 group-hover:text-primary transition-colors">
                                    {item.institution}
                                </h3>
                                <p className="text-lg font-medium text-foreground/80 mb-4 border-b border-white/5 pb-4">
                                    {item.degree}
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
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
