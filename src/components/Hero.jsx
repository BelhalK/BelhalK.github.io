import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { bio } from '../data/bio';
import { ArrowRight, Github, Linkedin, Mail, Twitter, Music, FileText } from 'lucide-react';

const SocialLink = ({ href, icon: Icon, label, delay }) => {
    const reduce = useReducedMotion();
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid place-items-center h-10 w-10 glass-button text-foreground/70 hover:text-primary"
        >
            <Icon size={17} />
        </motion.a>
    );
};

const ScholarIcon = ({ size = 17 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path d="M6.5 10.2V15c0 2.2 2.5 4 5.5 4s5.5-1.8 5.5-4v-4.8" />
        <path d="M21 8v7" />
        <path d="M21 15.5v.5" />
    </svg>
);

const ScholarSocialLink = ({ href, label, delay }) => {
    const reduce = useReducedMotion();
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid place-items-center h-10 w-10 glass-button text-foreground/70 hover:text-primary"
        >
            <ScholarIcon />
        </motion.a>
    );
};

const Hero = ({ setActiveTab }) => {
    const reduce = useReducedMotion();
    const fade = () => reduce ? { opacity: 1 } : { opacity: 0, y: 14 };

    return (
        <section className="relative">
            {/* Compact intro — no portrait, no abstract motif */}
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="max-w-3xl space-y-6">
                    <motion.div
                        initial={fade()} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur-md px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        {bio.location}
                    </motion.div>

                    <motion.h1
                        initial={fade()} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="font-display font-semibold leading-tight tracking-tight text-[clamp(2rem,5vw,3.25rem)]"
                    >
                        Belhal Karimi
                    </motion.h1>

                    <motion.p
                        initial={fade()} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.5 }}
                        className="text-base md:text-lg text-foreground/70 leading-relaxed max-w-xl"
                    >
                        <span className="font-medium text-foreground">{bio.role}</span> at {bio.company}{' '}
                        Building search, ranking, and GenAI systems. Moving applied machine learning from research to production.
                    </motion.p>

                    <motion.div
                        initial={fade()} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.26, duration: 0.5 }}
                        className="flex flex-wrap items-center gap-4"
                    >
                        <button
                            onClick={() => setActiveTab('research')}
                            className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-soft hover:bg-[hsl(14_64%_43%)] transition-all hover:gap-2.5"
                        >
                            View Research
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                        </button>

                        <div className="flex items-center gap-2">
                            <SocialLink href={bio.socials.github} icon={Github} label="GitHub" delay={0.32} />
                            <ScholarSocialLink href={bio.socials.scholar} label="Google Scholar" delay={0.36} />
                            <SocialLink href={bio.socials.linkedin} icon={Linkedin} label="LinkedIn" delay={0.4} />
                            <SocialLink href={bio.socials.twitter} icon={Twitter} label="Twitter" delay={0.44} />
                            <SocialLink href={bio.socials.soundcloud} icon={Music} label="SoundCloud" delay={0.48} />
                            <SocialLink href={`mailto:${bio.email}`} icon={Mail} label="Email" delay={0.52} />
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={reduce ? { opacity: 1 } : { opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="hidden md:flex justify-end"
                >
                    <div className="flex items-center justify-end gap-7 lg:gap-9">
                        {[
                            { src: '/assets/img/Logo_NIKE.svg', alt: 'Nike logo' },
                            { src: '/assets/img/jumpman.svg', alt: 'Jumpman logo' },
                            { src: '/assets/img/converse.png', alt: 'Converse logo' },
                        ].map((logo) => (
                            <img
                                key={logo.src}
                                src={logo.src}
                                alt={logo.alt}
                                className="h-10 w-20 object-contain opacity-80 lg:h-12 lg:w-24"
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* About / bio paragraphs */}
            <motion.div
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.5 }}
                className="mt-14 md:mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
                {bio.about.map((item, i) => (
                    <div key={i} className="glass-card p-5">
                        <h3 className="text-xs font-mono uppercase tracking-widest text-primary mb-2.5">{item.title}</h3>
                        <p className="text-sm text-foreground/75 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content }} />
                    </div>
                ))}
            </motion.div>

            {/* Latest updates */}
            <motion.div
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42, duration: 0.5 }}
                className="mt-12 pt-8 border-t border-border/70"
            >
                <div className="flex items-center gap-2 mb-5">
                    <FileText size={14} className="text-primary" />
                    <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Latest Updates</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {bio.news.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(0.42 + i * 0.05, 0.7), duration: 0.4 }}
                            className="glass-card p-5 flex flex-col gap-3"
                        >
                            <span className="self-start text-[11px] font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                {item.date}
                            </span>
                            <p className="text-sm text-foreground/85 leading-relaxed flex-1">{item.text}</p>
                            {item.link && (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors self-start"
                                >
                                    <FileText size={13} /> View paper
                                </a>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
