import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, MapPin, Building2 } from 'lucide-react';
import { industry } from '../data/industry';
import SectionHeader from './SectionHeader';

const IndustryCard = ({ role, index }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="h-full"
    >
        <div className="glass-card rounded-xl p-6 h-full hover:border-primary/40 transition-all duration-300 group flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                {role.link && (
                    <a href={role.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                        <ExternalLink size={24} />
                    </a>
                )}
            </div>

            <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-200 p-3 flex items-center justify-center shrink-0">
                    {role.logo ? (
                        <img src={role.logo} alt={role.company} className="w-full h-full object-contain rounded-md" />
                    ) : (
                        <Building2 size={32} className="text-muted-foreground" />
                    )}
                </div>
                <div>
                    <h3 className="text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                        {role.company}
                    </h3>
                    <p className="text-lg font-mono text-primary font-medium tracking-wide mt-1">
                        {role.role}
                    </p>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                {role.location && (
                    <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground/80">
                        <MapPin size={14} />
                        {role.location}
                    </div>
                )}
                <p className="text-muted-foreground leading-relaxed text-lg">
                    {role.description}
                </p>
            </div>
        </div>
    </motion.div>
);

const Industry = () => {
    return (
        <section>
            <SectionHeader
                title="Industry"
                subtitle="Professional experience, advisory roles, and entrepreneurial ventures."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {industry.map((role, index) => (
                    <IndustryCard key={index} role={role} index={index} />
                ))}
            </div>
        </section>
    );
};

export default Industry;
