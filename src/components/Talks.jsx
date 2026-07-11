import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { talks } from '../data/talks';
import { Video, FileText, MonitorPlay } from 'lucide-react';
import SectionHeader from './SectionHeader';

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

const TalkRow = ({ talk, index }) => {
    const reduce = useReducedMotion();

    return (
        <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
            className="group w-full min-w-0"
        >
            <div
                className="rounded-xl border bg-card/60 backdrop-blur-sm border-border/70 hover:border-primary/30 transition-colors w-full min-w-0 overflow-hidden"
            >
                <div className="flex items-center gap-3 p-3 md:p-4 min-w-0 w-full">
                    {/* Index */}
                    <span className="hidden sm:grid place-items-center h-7 w-7 shrink-0 rounded-full bg-muted/60 text-xs font-mono text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Title + details */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-display font-semibold text-foreground leading-snug group-hover:text-primary transition-colors truncate">
                            {talk.title}
                        </h3>
                        <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                            {talk.location} · {talk.date}
                        </p>
                    </div>

                    {/* Venue badge */}
                    <span className="hidden md:inline-block shrink-0 px-2.5 py-1 rounded-full text-xs font-mono font-semibold tracking-wide bg-primary/10 text-primary border border-primary/20">
                        {talk.venue}
                    </span>

                    {/* Compact actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {talk.links.slides && <ActionLink href={talk.links.slides} icon={FileText} label="Slides" />}
                        {talk.links.poster && <ActionLink href={talk.links.poster} icon={MonitorPlay} label="Poster" />}
                        {talk.links.video && <ActionLink href={talk.links.video} icon={Video} label="Video" />}
                    </div>
                </div>

                {/* Mobile venue badge */}
                <div className="md:hidden px-3 pb-2 -mt-1 w-full min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wide bg-primary/10 text-primary border border-primary/20">
                        {talk.venue}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

const CitiesHeader = () => {
    const reduce = useReducedMotion();
    const cities = [
        "Phoenix", "Iasi", "Moscow", "Paris", "Boston", "Vancouver", "Beijing", "Warwick"
    ];

    return (
        <div className="mb-6 md:mb-8">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3 text-center opacity-80">Talks In</p>
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
    return (
        <section>
            <SectionHeader
                title="Speaking"
                eyebrow="Talks"
                subtitle="Conference presentations, research seminars, and invited talks around the world."
                subtitleClassName="md:max-w-none"
            />

            <CitiesHeader />

            <div className="grid gap-2.5 w-full min-w-0">
                {talks.map((talk, index) => (
                    <TalkRow key={index} talk={talk} index={index} />
                ))}
            </div>
        </section>
    );
};

export default Talks;
