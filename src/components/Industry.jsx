import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, MapPin, Building2 } from 'lucide-react';
import { industry } from '../data/industry';
import SectionHeader from './SectionHeader';

const IndustryCard = ({ role, index }) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.35), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
        >
            <div className="glass-card p-6 w-full flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
                
                {/* Logo & Company & Title */}
                <div className="flex items-center gap-4 min-w-[280px] shrink-0">
                    <div className="grid place-items-center h-14 w-14 rounded-xl bg-white border border-border p-2 shrink-0 shadow-sm">
                        {role.logo ? (
                            <img
                                src={role.logo}
                                alt={`${role.company} logo`}
                                loading="lazy"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <Building2 size={24} className="text-muted-foreground" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg md:text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                            {role.company}
                        </h3>
                        <p className="text-xs font-mono text-primary font-semibold tracking-wide mt-1">
                            {role.role}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0 md:px-4">
                    <p className="text-sm md:text-base text-foreground/75 leading-relaxed">
                        {role.description}
                    </p>
                </div>

                {/* Location / Link */}
                <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center gap-3 shrink-0">
                    {role.location && (
                        <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                            <MapPin size={12} className="text-primary" />
                            {role.location}
                        </span>
                    )}
                    {role.link && (
                        <a
                            href={role.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Visit ${role.company}`}
                            className="grid place-items-center h-8 w-8 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const Industry = () => {
    const filteredRoles = industry.filter(role => 
        !role.role.toLowerCase().includes('advisor')
    );

    return (
        <section>
            <SectionHeader
                title="Experience"
                eyebrow="Industry"
                subtitle="Professional roles and entrepreneurial ventures across search, research, and applied AI."
                subtitleClassName="md:max-w-none"
            />
            <div className="flex flex-col gap-4">
                {filteredRoles.map((role, index) => (
                    <IndustryCard key={index} role={role} index={index} />
                ))}
            </div>
        </section>
    );
};

export default Industry;
