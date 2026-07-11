import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { software } from '../data/software';
import { Github, Globe, Book, FileText } from 'lucide-react';
import SectionHeader from './SectionHeader';

const Software = () => {
    const reduce = useReducedMotion();
    return (
        <section>
            <SectionHeader
                title="Software"
                eyebrow="Open Source"
                subtitle="Open source contributions and research software tools."
            />

            <div className="grid gap-5 md:grid-cols-2">
                {software.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.08, 0.3), duration: 0.5 }}
                    >
                        <div className="glass-card p-7 h-full flex flex-col group">
                            <h3 className="text-xl md:text-2xl font-display font-semibold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                            <p className="text-sm md:text-base text-foreground/75 mb-6 leading-relaxed flex-1">{item.description}</p>

                            <div className="flex flex-wrap gap-4">
                                {item.links.git && (
                                    <a href={item.links.git} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                        <Github size={17} /> Source
                                    </a>
                                )}
                                {item.links.web && (
                                    <a href={item.links.web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                        <Globe size={17} /> Website
                                    </a>
                                )}
                                {item.links.bookdown && (
                                    <a href={item.links.bookdown} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                        <Book size={17} /> Documentation
                                    </a>
                                )}
                                {item.links.latest && (
                                    <a href={item.links.latest} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                        <FileText size={17} /> Latest
                                    </a>
                                )}
                            </div>

                            <div className="mt-6 pt-5 border-t border-border/70 text-xs font-mono text-muted-foreground">
                                {item.authors}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Software;
