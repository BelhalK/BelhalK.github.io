import React from 'react';
import { motion } from 'framer-motion';
import { teaching } from '../data/teaching';
import { BookOpen, GraduationCap } from 'lucide-react';
import SectionHeader from './SectionHeader';

const Teaching = () => {
    return (
        <section>
            <SectionHeader
                title="Teaching"
                subtitle="Academic courses and workshops."
            />

            <div className="grid gap-6 md:grid-cols-2">
                {teaching.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card rounded-xl p-6 hover:border-primary/50 transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <BookOpen className="text-primary group-hover:scale-110 transition-transform" size={24} />
                            <h3 className="text-lg font-display font-medium text-foreground/80 group-hover:text-primary transition-colors">
                                {item.role}
                            </h3>
                        </div>
                        <p className="text-xl font-bold font-serif text-foreground leading-tight">
                            {item.course}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Teaching;
