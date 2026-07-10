import React from 'react';
import { motion } from 'framer-motion';
import { bio } from '../data/bio';
import { ArrowRight, Github, Linkedin, Mail, Twitter, Music, Sparkles, FileText } from 'lucide-react';

const SocialLink = ({ href, icon: Icon, delay }) => (
    <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="p-3 glass-button rounded-full text-muted-foreground hover:text-primary hover:scale-110"
    >
        <Icon size={20} />
    </motion.a>
);

const Hero = ({ setActiveTab }) => {
    return (
        <section className="min-h-[85vh] flex flex-col justify-center relative overflow-hidden pt-20">
            {/* Clean background - no heavy effects */}

            <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                {/* Text Content */}
                <div className="flex-1 space-y-10">
                    <motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-display font-bold tracking-tight leading-tight"
                        >
                            Hello, I'm <br />
                            <span className="text-gradient hover:opacity-80 transition-opacity duration-300">{bio.name}</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-6 text-xl md:text-2xl text-muted-foreground font-light leading-relaxed"
                        >
                            {bio.role} at <span className="text-foreground font-medium">{bio.company}</span>.
                            <br />
                            <span className="text-primary font-medium">Applied AI & Machine Learning</span>, from research to production.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col md:flex-row items-center gap-6 justify-center md:justify-start"
                    >
                        <button
                            onClick={() => setActiveTab('research')}
                            className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all hover:scale-105 flex items-center gap-2"
                        >
                            View Research <ArrowRight size={18} />
                        </button>

                        <div className="flex items-center gap-3">
                            <SocialLink href={bio.socials.github} icon={Github} delay={0.4} />
                            <SocialLink href={bio.socials.linkedin} icon={Linkedin} delay={0.5} />
                            <SocialLink href={bio.socials.twitter} icon={Twitter} delay={0.6} />
                            <SocialLink href={bio.socials.soundcloud} icon={Music} delay={0.7} />
                            <SocialLink href={`mailto:${bio.email}`} icon={Mail} delay={0.8} />
                        </div>
                    </motion.div>
                </div>

                {/* Profile Picture */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative shrink-0 w-64 h-64 md:w-80 md:h-80"
                >
                    <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-gray-200 rotate-3 hover:rotate-0 transition-all duration-500 z-10 group">
                        <img
                            src="/assets/img/belhal.PNG"
                            alt={bio.name}
                            className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700"
                        />
                    </div>
                </motion.div>
            </div>

            {/* News Ticker */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="pt-12 mt-12 border-t border-border/40 w-full max-w-6xl mx-auto"
            >
                <p className="text-sm font-mono text-muted-foreground mb-6 uppercase tracking-widest text-center md:text-left">Latest Updates</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {bio.news.map((item, i) => (
                        <div key={i} className="p-4 md:p-5 rounded-xl flex flex-col gap-3 hover:bg-gray-50 transition-colors border border-gray-200">
                            <div className="flex items-start gap-3">
                                <span className="text-xs font-bold text-primary whitespace-nowrap pt-0.5 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{item.date}</span>
                            </div>
                            <div className="text-sm text-foreground/90 leading-relaxed font-medium flex-1">{item.text}</div>
                            {item.link && (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors self-start mt-1"
                                >
                                    <FileText size={14} /> View Paper
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
