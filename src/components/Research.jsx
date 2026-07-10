import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Video, Github, AlignLeft } from 'lucide-react';
import { papers } from '../data/papers';
import SectionHeader from './SectionHeader';

const PaperCard = ({ paper, index }) => {
    const [isAbstractOpen, setIsAbstractOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
        >
            <div className="glass-card rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 h-full flex flex-col md:flex-row">
                {/* Thumbnail - hidden on mobile */}
                <div className="hidden md:flex md:w-64 shrink-0 bg-gray-50 p-6 items-center justify-center relative overflow-hidden border-r border-gray-200">
                    <img
                        src={paper.thumbnail}
                        alt={paper.title}
                        className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-500 z-10"
                    />
                </div>

                <div className="p-4 md:p-8 flex flex-col flex-1">
                    <div className="flex-1 space-y-3 md:space-y-4">
                        {/* Title and venue - stacked on mobile, side by side on desktop */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                            <h3 className="text-xl md:text-3xl font-display font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                                {paper.title}
                            </h3>
                            <span className="self-start shrink-0 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-sm md:text-base font-bold font-mono tracking-wider bg-primary/10 text-primary border border-primary/20">
                                {paper.venue}
                            </span>
                        </div>

                        <p className="text-sm md:text-lg font-mono text-muted-foreground/80 leading-relaxed">
                            {paper.authors}
                        </p>
                    </div>

                    <div className="flex gap-3 md:gap-4 mt-4 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 flex-wrap">
                        {paper.abstract && (
                            <button
                                onClick={() => setIsAbstractOpen(!isAbstractOpen)}
                                className={`flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium transition-colors ${isAbstractOpen ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-white"
                                    }`}
                            >
                                <AlignLeft size={16} className="md:w-[18px] md:h-[18px]" /> Abstract
                            </button>
                        )}
                        {paper.links.pdf && (
                            <a href={paper.links.pdf} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                                <FileText size={16} className="md:w-[18px] md:h-[18px]" /> PDF
                            </a>
                        )}
                        {paper.links.code && (
                            <a href={paper.links.code} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                                <Github size={16} className="md:w-[18px] md:h-[18px]" /> Code
                            </a>
                        )}
                        {paper.links.video && (
                            <a href={paper.links.video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                                <Video size={16} className="md:w-[18px] md:h-[18px]" /> Video
                            </a>
                        )}
                    </div>

                    <AnimatePresence>
                        {isAbstractOpen && paper.abstract && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <p className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 md:pl-4 py-3 md:py-4 mt-3 md:mt-4 bg-gray-50 rounded-r-lg">
                                    {paper.abstract}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

const ConferenceHeader = () => {
    const venues = [
        "NeurIPS", "ICLR", "COLT", "UAI", "ACML",
        "SIGKDD", "ICME", "IEEE BigData", "ALT",
        "CSDA", "AABI", "BAYSM", "ISIT"
    ];

    return (
        <div className="mb-12 md:mb-16">
            <p className="text-base md:text-lg font-mono text-primary tracking-widest uppercase mb-4 md:mb-6 text-center opacity-70">Published In</p>
            <div className="flex flex-nowrap md:flex-wrap justify-start md:justify-center gap-x-4 md:gap-x-6 gap-y-3 max-w-5xl mx-auto overflow-x-auto pb-2 px-2">
                {venues.map((venue, index) => (
                    <motion.span
                        key={venue}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="text-xl md:text-4xl font-display font-bold text-muted-foreground/30 hover:text-primary hover:scale-110 transition-all duration-200 cursor-default select-none whitespace-nowrap"
                    >
                        {venue}
                    </motion.span>
                ))}
            </div>
        </div>
    );
};

const Research = () => {
    return (
        <section>
            <SectionHeader
                title="Research"
                subtitle="Selected publications and research projects in Machine Learning and Artificial Intelligence."
            />

            <ConferenceHeader />

            <div className="grid gap-10">
                {papers.map((paper, index) => (
                    <PaperCard key={index} paper={paper} index={index} />
                ))}
            </div>
        </section>
    );
};

export default Research;
