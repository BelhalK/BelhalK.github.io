import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { awards } from '../data/awards';
import { Trophy } from 'lucide-react';
import SectionHeader from './SectionHeader';

const Awards = () => {
    const reduce = useReducedMotion();
    return (
        <section>
            <SectionHeader
                title="Honors"
                eyebrow="Awards"
                subtitle="Grants, travel awards, and recognitions."
            />

            <div className="grid gap-4">
                {awards.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.07, 0.35), duration: 0.45 }}
                        className="glass-card p-6 flex items-start gap-4 group"
                    >
                        <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                            <Trophy size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-display font-semibold mb-1.5 group-hover:text-primary transition-colors">{item.title}</h3>
                            <p className="text-sm md:text-base text-foreground/75 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Awards;
