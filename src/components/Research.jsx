import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FileText, Video, Github, AlignLeft } from 'lucide-react';
import { papers } from '../data/papers';
import SectionHeader from './SectionHeader';

/* ---------- Compact research rows ---------- */

const ActionLink = ({ href, icon: Icon, label }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className="grid place-items-center h-8 w-8 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
    >
        <Icon size={15} />
    </a>
);

const PaperRow = ({ paper, index }) => {
    const [isAbstractOpen, setIsAbstractOpen] = useState(false);
    const reduce = useReducedMotion();

    return (
        <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
            className="group w-full min-w-0"
        >
            <div
                className={`rounded-xl border bg-card/60 backdrop-blur-sm transition-colors ${isAbstractOpen ? 'border-primary/40' : 'border-border/70 hover:border-primary/30'} w-full min-w-0 overflow-hidden`}
            >
                <div className="flex items-center gap-3 p-3 md:p-4 min-w-0 w-full">
                    {/* Index */}
                    <span className="hidden sm:grid place-items-center h-7 w-7 shrink-0 rounded-full bg-muted/60 text-xs font-mono text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Title + authors */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-display font-semibold text-foreground leading-snug group-hover:text-primary transition-colors truncate">
                            {paper.title}
                        </h3>
                        <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                            {paper.authors}
                        </p>
                    </div>

                    {/* Venue badge */}
                    <span className="hidden md:inline-block shrink-0 px-2.5 py-1 rounded-full text-xs font-mono font-semibold tracking-wide bg-primary/10 text-primary border border-primary/20">
                        {paper.venue}
                    </span>

                    {/* Compact actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {paper.abstract && (
                            <button
                                onClick={() => setIsAbstractOpen(!isAbstractOpen)}
                                aria-expanded={isAbstractOpen}
                                aria-label={`${isAbstractOpen ? 'Hide' : 'Show'} abstract for ${paper.title}`}
                                title="Abstract"
                                className={`grid place-items-center h-8 w-8 rounded-lg transition-colors ${isAbstractOpen ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
                            >
                                <AlignLeft size={15} />
                            </button>
                        )}
                        {paper.links.pdf && <ActionLink href={paper.links.pdf} icon={FileText} label="PDF" />}
                        {paper.links.code && <ActionLink href={paper.links.code} icon={Github} label="Code" />}
                        {paper.links.video && <ActionLink href={paper.links.video} icon={Video} label="Video" />}
                    </div>
                </div>

                {/* Mobile venue badge (inline below title) */}
                <div className="md:hidden px-3 pb-2 -mt-1 w-full min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wide bg-primary/10 text-primary border border-primary/20">
                        {paper.venue}
                    </span>
                </div>

                {/* Expandable abstract */}
                <AnimatePresence>
                    {isAbstractOpen && paper.abstract && (
                        <motion.div
                            initial={reduce ? { height: 'auto' } : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={reduce ? { height: 0 } : { opacity: 0, height: 0 }}
                            className="overflow-hidden w-full"
                        >
                            <p className="text-sm text-foreground/70 leading-relaxed border-l-2 border-primary/40 ml-3 mr-3 mb-3 bg-muted/40 rounded-r-lg p-4">
                                {paper.abstract}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

/* ---------- Conference header (unchanged) ---------- */

const ConferenceHeader = () => {
    const reduce = useReducedMotion();
    const venues = [
        "NeurIPS", "ICLR", "COLT", "UAI", "ACML", "SIGKDD",
        "ICME", "IEEE BigData", "ALT", "CSDA", "AABI", "ISIT"
    ];

    return (
        <div className="mb-6 md:mb-8">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3 text-center opacity-80">Published In</p>
            <div className="flex flex-nowrap overflow-x-auto no-scrollbar justify-start md:justify-center gap-x-4 max-w-none mx-auto pb-2 w-full">
                {venues.map((venue, index) => (
                    <motion.span
                        key={venue}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        className="text-lg md:text-2xl font-display font-semibold text-muted-foreground/40 hover:text-primary hover:scale-105 transition-all duration-200 cursor-default select-none whitespace-nowrap"
                    >
                        {venue}
                    </motion.span>
                ))}
            </div>
        </div>
    );
};

/* ---------- Section ---------- */

const Research = () => {
    const [activeFilter, setActiveFilter] = useState('All');

    const getFilteredPapers = () => {
        if (activeFilter === 'All') return papers;
        if (activeFilter === 'Optimization') {
            return papers.filter(p => 
                p.title.toLowerCase().includes('optimization') || 
                p.title.toLowerCase().includes('convergence') ||
                p.title.toLowerCase().includes('minimization') ||
                p.title.toLowerCase().includes('gradient')
            );
        }
        if (activeFilter === 'Federated Learning') {
            return papers.filter(p => 
                p.title.toLowerCase().includes('federated') || 
                p.title.toLowerCase().includes('distributed') ||
                p.title.toLowerCase().includes('decentralized')
            );
        }
        if (activeFilter === 'Generative & EBMs') {
            return papers.filter(p => 
                p.title.toLowerCase().includes('langevin') || 
                p.title.toLowerCase().includes('energy') ||
                p.title.toLowerCase().includes('flow') ||
                p.title.toLowerCase().includes('variational')
            );
        }
        return papers;
    };

    const filteredPapers = getFilteredPapers();

    return (
        <section>
            <SectionHeader
                title="Publications"
                eyebrow="Research"
                subtitle="Selected publications and research projects in ML and AI."
                subtitleClassName="md:max-w-none md:whitespace-nowrap"
                className="mb-6 md:mb-8"
            />

            <ConferenceHeader />

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 pb-6 mb-6 border-b border-border/40 justify-center">
                {['All', 'Generative & EBMs', 'Federated Learning', 'Optimization'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 rounded-full text-xs font-mono tracking-tight font-medium transition-all ${
                            activeFilter === filter 
                                ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                                : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <div className="grid gap-2.5">
                {filteredPapers.map((paper, index) => (
                    <PaperRow key={index} paper={paper} index={index} />
                ))}
            </div>
        </section>
    );
};

export default Research;
