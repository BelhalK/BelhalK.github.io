import React from 'react';
import { motion } from 'framer-motion';
import { software } from '../data/software';
import { Github, Globe, Book } from 'lucide-react';
import SectionHeader from './SectionHeader';

const Software = () => {
    return (
        <section>
            <SectionHeader
                title="Software"
                subtitle="Open source contributions and development tools."
            />

            <div className="grid gap-6 md:grid-cols-2">
                {software.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="glass-card rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 group">
                            <h3 className="text-2xl font-display font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                            <p className="text-muted-foreground mb-6 leading-relaxed">{item.description}</p>

                            <div className="flex flex-wrap gap-4">
                                {item.links.git && (
                                    <a href={item.links.git} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                        <Github size={18} /> Source
                                    </a>
                                )}
                                {item.links.web && (
                                    <a href={item.links.web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                        <Globe size={18} /> Website
                                    </a>
                                )}
                                {item.links.bookdown && (
                                    <a href={item.links.bookdown} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                        <Book size={18} /> Documentation
                                    </a>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5 text-xs font-mono text-muted-foreground/60">
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
