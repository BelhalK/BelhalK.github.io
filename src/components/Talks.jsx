import React from 'react';
import { motion } from 'framer-motion';
import { talks } from '../data/talks';
import { Video, FileText, MapPin, Calendar, MonitorPlay } from 'lucide-react';
import SectionHeader from './SectionHeader';

const CitiesHeader = () => {
    const cities = [
        "Phoenix", "Iasi", "Moscow", "Paris", "Boston", "Vancouver", "Beijing", "Warwick"
    ];

    return (
        <div className="mb-16">
            <p className="text-lg font-mono text-primary tracking-widest uppercase mb-6 text-center opacity-70">Talks In</p>
            <div className="flex flex-nowrap justify-center gap-x-6 overflow-x-auto pb-2">
                {cities.map((city, index) => (
                    <motion.span
                        key={city}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="text-2xl md:text-4xl font-display font-bold text-muted-foreground/30 hover:text-primary hover:scale-110 transition-all duration-200 cursor-default select-none whitespace-nowrap"
                    >
                        {city}
                    </motion.span>
                ))}
            </div>
        </div>
    );
};

const Talks = () => {
    return (
        <section>
            <SectionHeader
                title="Talks"
                subtitle="Conference presentations, seminars, and public speaking."
            />

            <CitiesHeader />

            <div className="grid gap-6">
                {talks.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card rounded-xl p-6 hover:border-primary/40 transition-all duration-300 md:flex items-center gap-6 group"
                    >
                        <div className="flex-1 space-y-3">
                            <h3 className="text-xl font-display font-bold group-hover:text-primary transition-colors leading-tight">{item.title}</h3>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-mono text-muted-foreground">
                                <span className="text-primary font-bold">{item.venue}</span>
                                <span className="flex items-center gap-2"><MapPin size={14} /> {item.location}</span>
                                <span className="flex items-center gap-2"><Calendar size={14} /> {item.date}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5 shrink-0">
                            {item.links.slides && (
                                <a
                                    href={item.links.slides}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-primary transition-colors"
                                    title="Slides"
                                >
                                    <FileText size={20} />
                                </a>
                            )}
                            {item.links.poster && (
                                <a
                                    href={item.links.poster}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-primary transition-colors"
                                    title="Poster"
                                >
                                    <MonitorPlay size={20} />
                                </a>
                            )}
                            {item.links.video && (
                                <a
                                    href={item.links.video}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-primary transition-colors"
                                    title="Video"
                                >
                                    <Video size={20} />
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
