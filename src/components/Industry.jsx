import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, MapPin, Building2 } from 'lucide-react';
import { industry } from '../data/industry';
import SectionHeader from './SectionHeader';

const IndustryCard = ({ role, index }) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
        >
            <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden group">
                {role.link && (
                    <a
                        href={role.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${role.company}`}
                        className="absolute top-4 right-4 grid place-items-center h-9 w-9 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        <ExternalLink size={16} />
                    </a>
                )}

                <div className="flex items-center gap-4 mb-5">
                    <div className="grid place-items-center h-16 w-16 rounded-xl bg-white border border-border p-2.5 shrink-0">
                        {role.logo ? (
                            <img
                                src={role.logo}
                                alt={`${role.company} logo`}
                                loading="lazy"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <Building2 size={28} className="text-muted-foreground" />
                        )}
                    </div>
                    <div className="pr-9">
                        <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                            {role.company}
                        </h3>
                        <p className="text-sm font-mono text-primary font-medium tracking-wide mt-1">
                            {role.role}
                        </p>
                    </div>
                </div>

                <div className="space-y-3 flex-1">
                    {role.location && (
                        <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
                            <MapPin size={13} />
                            {role.location}
                        </div>
                    )}
                    <p className="text-sm md:text-base text-foreground/75 leading-relaxed">
                        {role.description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const Industry = () => {
    return (
        <section>
            <SectionHeader
                title="Industry"
                eyebrow="Experience"
                subtitle="Professional roles, advisory work, and entrepreneurial ventures across search, research, and applied AI."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {industry.map((role, index) => (
                    <IndustryCard key={index} role={role} index={index} />
                ))}
            </div>
        </section>
    );
};

export default Industry;
