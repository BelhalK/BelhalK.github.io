import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { talks } from '../data/talks';
import { Video, FileText, MapPin, Calendar, MonitorPlay } from 'lucide-react';
import SectionHeader from './SectionHeader';

const CitiesHeader = () => {
    const reduce = useReducedMotion();
    const cities = [
        "Phoenix", "Iasi", "Moscow", "Paris", "Boston", "Vancouver", "Beijing", "Warwick"
    ];

    return (
        <div className="mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-5 text-center opacity-80">Talks In</p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 max-w-4xl mx-auto">
                {cities.map((city, index) => (
                    <motion.span
                        key={city}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(index * 0.04, 0.3) }}
                        className="text-lg md:text-2xl font-display font-semibold text-muted-foreground/40 hover:text-primary hover:scale-105 transition-all duration-200 cursor-default select-none"
                    >
                        {city}
                    </motion.span>
                ))}
            </div>
        </div>
    );
};

const Talks = () => {
    const reduce = useReducedMotion();
    return (
        <section>
            <SectionHeader
                title="Talks"
                eyebrow="Speaking"
                subtitle="Conference presentations, research seminars, and invited talks around the world."
            />

            <CitiesHeader />

            <div className="grid gap-4">
                {talks.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.45 }}
                        className="glass-card p-5 md:p-6 md:flex md:items-center md:gap-6 group"
                    >
                        <div className="flex-1 space-y-2">
                            <h3 className="text-lg md:text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">{item.title}</h3>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-mono text-muted-foreground">
                                <span className="text-primary font-semibold">{item.venue}</span>
                                <span className="flex items-center gap-1.5"><MapPin size={13} /> {item.location}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={13} /> {item.date}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4 md:mt-0 pt-4 md:pt-0 md:pl-4 border-t md:border-t-0 md:border-l border-border/70 shrink-0">
                            {item.links.slides && (
                                <a href={item.links.slides} target="_blank" rel="noopener noreferrer" className="grid place-items-center h-10 w-10 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors" title="Slides" aria-label={`Slides for ${item.title}`}>
                                    <FileText size={18} />
                                </a>
                            )}
                            {item.links.poster && (
                                <a href={item.links.poster} target="_blank" rel="noopener noreferrer" className="grid place-items-center h-10 w-10 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors" title="Poster" aria-label={`Poster for ${item.title}`}>
                                    <MonitorPlay size={18} />
                                </a>
                            )}
                            {item.links.video && (
                                <a href={item.links.video} target="_blank" rel="noopener noreferrer" className="grid place-items-center h-10 w-10 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors" title="Video" aria-label={`Video for ${item.title}`}>
                                    <Video size={18} />
                                </a>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Talks;
