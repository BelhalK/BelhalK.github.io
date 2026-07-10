import React from 'react';
import { motion } from 'framer-motion';
import { awards } from '../data/awards';
import { Award, Trophy } from 'lucide-react';
import SectionHeader from './SectionHeader';

const Awards = () => {
    return (
        <section>
            <SectionHeader
                title="Awards"
                subtitle="Honors, grants, and recognitions."
            />

            <div className="grid gap-6">
                {awards.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card rounded-xl p-6 hover:border-primary/50 transition-all duration-300 flex items-start gap-4 group"
                    >
                        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
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
