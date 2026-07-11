import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, MapPin, Building2 } from 'lucide-react';
import SectionHeader from './SectionHeader';

const advisoryData = [
    {
        company: "Monk AI",
        role: "Scientific Advisor",
        location: "Paris, FR",
        description: "Scientific advisor. Built damage detection models using Mask R-CNN. Acquired by ACV Auctions.",
        link: "https://monk.ai/",
        logo: "/assets/industry/monk.png",
        status: "Acquired"
    },
    {
        company: "Brainattic",
        role: "Scientific Advisor",
        location: "Montreal, CA / Paris, FR",
        description: "Scientific advisor. Researched information retrieval in video streams and automatic trailer generation using Deep Learning. Acquired by Master The Monster.",
        link: "https://www.apollo.io/companies/brainattic/5a9e91cea6da98d94d907f4d?chart=count",
        logo: "/assets/industry/brainattic.png",
        status: "Acquired"
    },
    {
        company: "EyeCareX",
        role: "Scientific Advisor",
        location: "Vancouver, BC, CA",
        description: "Scientific advisor. Developing AI-enabled at-home eye tests connected to remote optometrists.",
        link: "https://www.eyecarex.com/",
        logo: "/assets/industry/eyecarex.png",
        status: "Active"
    }
];

const AdvisoryCard = ({ card, index }) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
        >
            <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden group">
                {card.link && (
                    <a
                        href={card.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${card.company}`}
                        className="absolute top-4 right-4 grid place-items-center h-9 w-9 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        <ExternalLink size={16} />
                    </a>
                )}

                {/* Logo & Company Title & Role */}
                <div className="flex items-center gap-4 mb-5">
                    <div className={`grid place-items-center h-16 w-16 rounded-xl bg-white border border-border shrink-0 shadow-sm overflow-hidden ${card.company === 'Brainattic' ? 'p-0' : 'p-2.5'}`}>
                        {card.logo ? (
                            <img
                                src={card.logo}
                                alt={`${card.company} logo`}
                                loading="lazy"
                                className={`w-full h-full ${card.company === 'Brainattic' ? 'object-cover scale-[1.05]' : 'object-contain'}`}
                            />
                        ) : (
                            <Building2 size={28} className="text-muted-foreground" />
                        )}
                    </div>
                    <div className="pr-9">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wide border mb-1.5 ${
                            card.status === 'Acquired' 
                                ? 'bg-primary/10 text-primary border-primary/20' 
                                : 'bg-[hsl(180_65%_35%)]/10 text-[hsl(180_65%_35%)] border-[hsl(180_65%_35%)]/20'
                        }`}>
                            {card.status}
                        </span>
                        <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                            {card.company}
                        </h3>
                        <p className="text-sm font-mono text-primary font-medium tracking-wide mt-1">
                            {card.role}
                        </p>
                    </div>
                </div>

                {/* Body Details */}
                <div className="space-y-3 flex-1">
                    {card.location && (
                        <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
                            <MapPin size={13} className="text-primary" />
                            {card.location}
                        </div>
                    )}
                    <p className="text-sm md:text-base text-foreground/75 leading-relaxed">
                        {card.description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const Advisory = () => {
    return (
        <section>
            <SectionHeader
                title="Advisory"
                eyebrow="Advisory Work"
                subtitle="Advising high-potential technology startups on applying state-of-the-art computer vision and information retrieval models."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {advisoryData.map((card, index) => (
                    <AdvisoryCard key={index} card={card} index={index} />
                ))}
            </div>
        </section>
    );
};

export default Advisory;
