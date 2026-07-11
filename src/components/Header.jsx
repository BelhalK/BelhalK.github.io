import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { User, FileText, Mic, Briefcase, Music, Laptop, Award, BookOpen, GraduationCap, Cpu } from 'lucide-react';

const navItems = [
    { id: 'about', label: 'About', icon: User },
    { id: 'research', label: 'Research', icon: FileText },
    { id: 'talks', label: 'Talks', icon: Mic },
    { id: 'industry', label: 'Industry', icon: Briefcase },
    { id: 'advisory', label: 'Advisory', icon: Cpu },
    { id: 'software', label: 'Software', icon: Laptop },
    { id: 'awards', label: 'Awards', icon: Award },
    { id: 'teaching', label: 'Teaching', icon: BookOpen },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'music', label: 'Music', icon: Music },
];

const Header = ({ activeTab, setActiveTab }) => {
    const reduce = useReducedMotion();

    const handleSelect = (id) => {
        setActiveTab(id);
    };

    return (
        <motion.header
            initial={reduce ? { opacity: 1 } : { y: -90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50"
        >
            <div className="mx-auto max-w-[1240px] px-4 sm:px-8 lg:px-12 pt-4">
                <div className="flex items-center justify-between gap-3 rounded-full border border-border/80 bg-card/70 backdrop-blur-md px-3 py-2 shadow-soft">
                    {/* Brand */}
                    <button
                        onClick={() => handleSelect('about')}
                        className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-muted/60 transition-colors shrink-0"
                        aria-label="Go to about"
                    >
                        <span className="grid place-items-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold font-display">B</span>
                        <span className="font-display text-base font-semibold tracking-tight hidden sm:block">Belhal Karimi</span>
                    </button>

                    {/* Centered Brand Logos */}
                    <div className="hidden md:flex items-center gap-5 px-4 py-1.5 bg-muted/40 rounded-full border border-border/40 shrink-0">
                        <img src="/assets/img/Logo_NIKE.svg" alt="Nike" className="h-4 w-auto dark:invert opacity-70" />
                        <img src="/assets/img/jumpman.svg" alt="Jumpman" className="h-5 w-auto dark:invert opacity-70" />
                        <img src="/assets/img/converse.png" alt="Converse" className="h-5 w-auto dark:invert opacity-70" />
                    </div>

                    {/* Desktop nav — icons + labels */}
                    <nav className="hidden lg:flex items-center gap-0.5" aria-label="Primary">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`relative px-3 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors outline-none
                                        ${isActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-muted/70'}`}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="activeTabPill"
                                            className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-primary/30"
                                            transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0.18, duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-1.5">
                                        <Icon size={15} />
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Mobile/tablet icon nav — directly accessible, horizontally scrollable */}
                    <nav
                        className="lg:hidden flex items-center gap-1 overflow-x-auto no-scrollbar -mr-1 pr-1"
                        aria-label="Primary"
                    >
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                    aria-label={item.label}
                                    title={item.label}
                                    className={`relative grid place-items-center h-9 w-9 rounded-full shrink-0 transition-colors outline-none
                                        ${isActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-muted/70'}`}
                                >
                                    {isActive && (
                                        <span className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-primary/30" />
                                    )}
                                    <Icon size={17} className="relative z-10" />
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
