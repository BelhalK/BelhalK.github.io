import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
    Briefcase,
    BookOpen,
    GraduationCap,
    Award,
    Laptop,
    Mic,
    Music,
    FileText,
    User,
    Github,
    Linkedin,
    Twitter,
    Mail,
    Sun,
    Moon,
    ExternalLink,
    Menu,
    X,
    ArrowUpRight,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    MapPin,
    Target,
    Cpu
} from 'lucide-react';

import { bio } from './data/bio';
import { industry } from './data/industry';
import { papers } from './data/papers';
import { education } from './data/education';
import { awards } from './data/awards';
import { talks } from './data/talks';
import { teaching } from './data/teaching';
import { playlists, production } from './data/music';

// --- Scroll Spy Hooks ---
const useScrollSpy = (sectionIds, offset = 120) => {
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + offset;

            for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (el) {
                    const { top, bottom } = el.getBoundingClientRect();
                    const absoluteTop = top + window.scrollY;
                    const absoluteBottom = bottom + window.scrollY;

                    if (scrollPosition >= absoluteTop && scrollPosition < absoluteBottom) {
                        setActiveId(id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [sectionIds, offset]);

    return activeId;
};

// --- Custom Google Scholar Stroke Icon ---
const ScholarIcon = ({ className, size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
    >
        <path d="M12 3L2 8l10 5 10-5-10-5z" />
        <path d="M6 10v6c0 2.2 2.7 4 6 4s6-1.8 6-4v-6" />
        <path d="M22 8v6.5" />
    </svg>
);

// --- BibTeX Citation Helper ---
const generateBibtex = (paper) => {
    const firstAuthor = paper.authors.split(',')[0].split(' ').pop().toLowerCase();
    const yearMatch = paper.venue.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
    const venueShort = paper.venue.split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
    const citationKey = `${firstAuthor}${year}${venueShort}`;
    
    return `@article{${citationKey},
  title={${paper.title}},
  author={${paper.authors}},
  journal={${paper.venue}},
  year={${year}},
  url={${paper.links.pdf || ''}}
}`;
};

export default function App() {
    const [theme, setTheme] = useState('dark');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [paperFilter, setPaperFilter] = useState('All');
    const [expandedPaper, setExpandedPaper] = useState(null);
    const [copiedPaper, setCopiedPaper] = useState(null);
    const reduce = useReducedMotion();

    const sections = [
        { id: 'about', label: 'About', icon: User },
        { id: 'highlights', label: 'Key Highlights', icon: Target },
        { id: 'experience', label: 'Career Journey', icon: Briefcase },
        { id: 'research', label: 'Research Hub', icon: FileText },
        { id: 'advisory', label: 'Advisory & Exits', icon: Cpu },
        { id: 'skills', label: 'Skills & Tech', icon: Laptop },
        { id: 'talks', label: 'Talks & Teaching', icon: Mic },
        { id: 'music', label: 'Creative Work', icon: Music },
    ];

    const sectionIds = sections.map(s => s.id);
    const activeSection = useScrollSpy(sectionIds, 160);

    // Initialize theme
    useEffect(() => {
        const storedTheme = localStorage.getItem('portfolio-theme');
        if (storedTheme) {
            setTheme(storedTheme);
            if (storedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('portfolio-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('portfolio-theme', nextTheme);
        if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleCopyBibtex = (paper, index) => {
        const bibtex = generateBibtex(paper);
        navigator.clipboard.writeText(bibtex).then(() => {
            setCopiedPaper(index);
            setTimeout(() => setCopiedPaper(null), 2000);
        });
    };

    const getFilteredPapers = () => {
        if (paperFilter === 'All') return papers;
        if (paperFilter === 'Optimization') {
            return papers.filter(p => 
                p.title.toLowerCase().includes('optimization') || 
                p.title.toLowerCase().includes('convergence') ||
                p.title.toLowerCase().includes('minimization') ||
                p.title.toLowerCase().includes('gradient')
            );
        }
        if (paperFilter === 'Federated Learning') {
            return papers.filter(p => 
                p.title.toLowerCase().includes('federated') || 
                p.title.toLowerCase().includes('distributed') ||
                p.title.toLowerCase().includes('decentralized')
            );
        }
        if (paperFilter === 'Generative & EBMs') {
            return papers.filter(p => 
                p.title.toLowerCase().includes('langevin') || 
                p.title.toLowerCase().includes('energy') ||
                p.title.toLowerCase().includes('flow') ||
                p.title.toLowerCase().includes('variational')
            );
        }
        return papers;
    };

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            const offset = 100;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = el.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: reduce ? 'auto' : 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen text-foreground transition-colors duration-300 relative">
            {/* Ambient Background Grid Overlay */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-background transition-colors duration-300">
                <div className="absolute inset-0 grain-overlay opacity-[0.4]" />
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full blur-[140px] opacity-[0.08] dark:opacity-[0.15] bg-primary pointer-events-none" />
                <div className="absolute bottom-20 left-0 w-[35vw] h-[35vw] rounded-full blur-[120px] opacity-[0.06] dark:opacity-[0.1] bg-academic pointer-events-none" />
            </div>

            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-3 items-center">
                    
                    {/* Left: BK badge */}
                    <div className="justify-self-start">
                        <button 
                            onClick={() => scrollToSection('about')}
                            className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                            aria-label="BK Home"
                        >
                            BK
                        </button>
                    </div>

                    {/* Center: Brand logos (Nike, Jumpman, Converse) */}
                    <div className="justify-self-center flex items-center gap-6 sm:gap-8">
                        <img 
                            src="/assets/img/Logo_NIKE.svg" 
                            alt="Nike" 
                            className="h-4 sm:h-5 w-auto dark:invert opacity-70 hover:opacity-100 transition-opacity" 
                        />
                        <img 
                            src="/assets/img/jumpman.svg" 
                            alt="Jumpman" 
                            className="h-5 sm:h-6 w-auto dark:invert opacity-70 hover:opacity-100 transition-opacity" 
                        />
                        <img 
                            src="/assets/img/converse.png" 
                            alt="Converse" 
                            className="h-5 sm:h-6 w-auto dark:invert opacity-70 hover:opacity-100 transition-opacity" 
                        />
                    </div>

                    {/* Right: theme & mobile toggle */}
                    <div className="justify-self-end flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                        </button>
                        
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Open navigation menu"
                        >
                            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Nav Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-x-0 top-16 z-30 bg-background border-b border-border/80 p-6 flex flex-col gap-3 shadow-lg lg:hidden"
                    >
                        {sections.map((s) => {
                            const Icon = s.icon;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => scrollToSection(s.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                        activeSection === s.id 
                                            ? 'bg-primary/10 text-primary border border-primary/20' 
                                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Icon size={16} />
                                    {s.label}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MAIN PAGE CONTAINER --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
                <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-16 lg:items-start">
                    
                    {/* --- DESKTOP STICKY SIDEBAR --- */}
                    <aside className="hidden lg:block sticky top-28 w-full space-y-8 select-none">
                        {/* Profile Info */}
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur-sm text-xs font-mono text-muted-foreground uppercase tracking-widest">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                {bio.location}
                            </div>
                            <h2 className="font-display text-2xl font-bold tracking-tight">{bio.name}</h2>
                            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                                {bio.role} @ <span className="text-foreground font-semibold">{bio.company}</span>
                            </p>
                        </div>

                        {/* Navigation Index */}
                        <nav className="space-y-1.5 flex flex-col">
                            {sections.map((s) => {
                                const Icon = s.icon;
                                const isActive = activeSection === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => scrollToSection(s.id)}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium tracking-tight text-left relative transition-all group ${
                                            isActive 
                                                ? 'text-primary bg-primary/5 font-semibold border border-primary/10 shadow-sm' 
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                        }`}
                                    >
                                        <Icon size={16} className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                                        {s.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Social Links */}
                        <div className="pt-4 border-t border-border/40">
                            <div className="flex flex-wrap gap-2.5">
                                <a 
                                    href={bio.socials.github} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-2.5 rounded-lg bg-card hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition-all"
                                    title="GitHub"
                                >
                                    <Github size={16} />
                                </a>
                                <a 
                                    href={bio.socials.scholar} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-2.5 rounded-lg bg-card hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                                    title="Google Scholar"
                                >
                                    <ScholarIcon size={16} />
                                </a>
                                <a 
                                    href={bio.socials.linkedin} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-2.5 rounded-lg bg-card hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition-all"
                                    title="LinkedIn"
                                >
                                    <Linkedin size={16} />
                                </a>
                                <a 
                                    href={bio.socials.twitter} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-2.5 rounded-lg bg-card hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition-all"
                                    title="Twitter"
                                >
                                    <Twitter size={16} />
                                </a>
                                <a 
                                    href={`mailto:${bio.email}`}
                                    className="p-2.5 rounded-lg bg-card hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition-all"
                                    title="Email"
                                >
                                    <Mail size={16} />
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* --- SCROLLABLE MAIN CONTENT --- */}
                    <main className="space-y-32 lg:pl-4">
                        
                        {/* SECTION: ABOUT & HERO */}
                        <section id="about" className="space-y-8 scroll-mt-24">
                            <div className="space-y-6">
                                <h1 className="font-display font-bold leading-tight tracking-tight text-3xl sm:text-4xl lg:text-5xl text-foreground">
                                    Principal Data Scientist & ML Researcher.
                                </h1>
                                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
                                    I am a <span className="text-foreground font-semibold">Principal Data Scientist at Nike</span> leading generative AI integrations in Footwear and Apparel design. 
                                    With a background in deep statistical modeling and optimization from <span className="text-foreground font-semibold">MIT, Polytechnique, INRIA, and Baidu Research</span>, 
                                    my career focuses on moving machine learning from mathematical foundations to industry scale.
                                </p>
                            </div>

                            {/* Mobile Info & Socials (hidden on desktop) */}
                            <div className="block lg:hidden space-y-6 border-t border-b border-border/60 py-6">
                                <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm font-mono text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-primary" /> {bio.location}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase size={14} className="text-primary" /> {bio.role} @ {bio.company}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <a href={bio.socials.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono font-medium hover:text-primary transition-all">
                                        <Github size={14} /> Github
                                    </a>
                                    <a href={bio.socials.scholar} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono font-medium hover:text-primary transition-all">
                                        <ScholarIcon size={14} /> Scholar
                                    </a>
                                    <a href={bio.socials.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono font-medium hover:text-primary transition-all">
                                        <Linkedin size={14} /> LinkedIn
                                    </a>
                                    <a href={`mailto:${bio.email}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono font-medium hover:text-primary transition-all">
                                        <Mail size={14} /> Email
                                    </a>
                                </div>
                            </div>

                            {/* Core Philosophy Paragraphs */}
                            <div className="grid md:grid-cols-3 gap-6 pt-4">
                                {bio.about.map((item, idx) => (
                                    <div key={idx} className="editorial-card p-6 flex flex-col gap-3 bg-card/40 backdrop-blur-sm">
                                        <h3 className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{item.content}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SECTION: HIGHLIGHTS MATRIX */}
                        <section id="highlights" className="scroll-mt-28 space-y-8">
                            <div className="space-y-2">
                                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary font-semibold">Dashboard</span>
                                <h2 className="font-display text-3xl font-bold tracking-tight">Key Highlights</h2>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div className="editorial-card p-6 bg-card/60 backdrop-blur-sm border-l-4 border-l-primary flex flex-col justify-between h-40">
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Nike Leadership</span>
                                    <p className="text-sm font-medium leading-snug">Led Generative AI integration in footwear & product design; previously Matching & Search ranking.</p>
                                </div>
                                <div className="editorial-card p-6 bg-card/60 backdrop-blur-sm border-l-4 border-l-academic flex flex-col justify-between h-40">
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Research Publications</span>
                                    <p className="text-sm font-medium leading-snug">15+ papers in elite journals & conferences (ICLR, NeurIPS, UAI, ACML, COLT) in ML/Optimization.</p>
                                </div>
                                <div className="editorial-card p-6 bg-card/60 backdrop-blur-sm border-l-4 border-l-primary flex flex-col justify-between h-40">
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Acquisitions</span>
                                    <p className="text-sm font-medium leading-snug">Advisory exits with Monk AI (acquired by ACV Auctions) and Brainattic (acquired by Master The Monster).</p>
                                </div>
                                <div className="editorial-card p-6 bg-card/60 backdrop-blur-sm border-l-4 border-l-academic flex flex-col justify-between h-40">
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">PhD & Academic Exits</span>
                                    <p className="text-sm font-medium leading-snug">PhD from Ecole Polytechnique & INRIA. Visiting scholar at MIT. Interned at Samsung AI.</p>
                                </div>
                            </div>
                        </section>

                        {/* SECTION: EXPERIENCE TIMELINE */}
                        <section id="experience" className="scroll-mt-28 space-y-10">
                            <div className="space-y-2">
                                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary font-semibold">Career History</span>
                                <h2 className="font-display text-3xl font-bold tracking-tight">Timeline</h2>
                            </div>

                            <div className="relative border-l border-border/80 ml-4 space-y-12">
                                {industry.map((role, idx) => (
                                    <div key={idx} className="relative pl-8 group">
                                        <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border border-border bg-background group-hover:border-primary group-hover:bg-primary transition-all duration-300" />
                                        
                                        <div className="grid md:grid-cols-[1fr_2fr] gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                                        {role.company}
                                                    </h3>
                                                    {role.link && (
                                                        <a href={role.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                                            <ArrowUpRight size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-xs font-mono text-primary font-semibold uppercase tracking-wider">
                                                    {role.role}
                                                </p>
                                                <p className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                                                    <MapPin size={10} /> {role.location}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {role.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SECTION: RESEARCH HUB */}
                        <section id="research" className="scroll-mt-28 space-y-10">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary font-semibold">Publications</span>
                                    <h2 className="font-display text-3xl font-bold tracking-tight">Research Hub</h2>
                                </div>
                                <p className="text-sm text-muted-foreground max-w-2xl">
                                    Explore peer-reviewed publications. Click any paper to view its abstract, citation snippets (BibTeX), and downloadable PDFs.
                                </p>

                                <div className="flex flex-wrap gap-2 pb-2 border-b border-border/40">
                                    {['All', 'Generative & EBMs', 'Federated Learning', 'Optimization'].map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                setPaperFilter(filter);
                                                setExpandedPaper(null);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-tight font-medium transition-all ${
                                                paperFilter === filter 
                                                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                                                    : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {getFilteredPapers().map((paper, idx) => {
                                    const isExpanded = expandedPaper === idx;
                                    return (
                                        <div 
                                            key={idx}
                                            className={`editorial-card bg-card/40 hover:bg-card/75 border transition-all duration-300 ${
                                                isExpanded ? 'border-primary/40 shadow-md ring-1 ring-primary/5' : 'border-border/60'
                                            }`}
                                        >
                                            <div 
                                                onClick={() => setExpandedPaper(isExpanded ? null : idx)}
                                                className="p-5 flex items-start gap-4 cursor-pointer select-none"
                                            >
                                                <div className="hidden sm:grid place-items-center h-8 w-8 rounded-lg bg-muted text-xs font-mono font-semibold text-muted-foreground">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </div>
                                                <div className="flex-grow space-y-1 min-w-0">
                                                    <h3 className="font-display font-bold text-base md:text-lg text-foreground hover:text-primary transition-colors leading-snug">
                                                        {paper.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground font-mono truncate">
                                                        {paper.authors}
                                                    </p>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-semibold">
                                                            {paper.venue}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-muted-foreground self-center">
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="border-t border-border/50 bg-muted/20 overflow-hidden"
                                                    >
                                                        <div className="p-5 space-y-6">
                                                            {paper.abstract && (
                                                                <div className="space-y-2">
                                                                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">Abstract</h4>
                                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                                        {paper.abstract}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">BibTeX Citation</h4>
                                                                    <button 
                                                                        onClick={() => handleCopyBibtex(paper, idx)}
                                                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-card hover:bg-muted border border-border text-[10px] font-mono hover:text-primary transition-colors"
                                                                    >
                                                                        {copiedPaper === idx ? (
                                                                            <>
                                                                                <Check size={11} className="text-green-500" /> Copied
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy size={11} /> Copy BibTeX
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                <pre className="p-4 rounded-lg bg-card/80 border border-border/80 font-mono text-xs overflow-x-auto text-muted-foreground whitespace-pre select-all no-scrollbar">
                                                                    {generateBibtex(paper)}
                                                                </pre>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2 pt-2">
                                                                {paper.links.pdf && (
                                                                    <a 
                                                                        href={paper.links.pdf} 
                                                                        target="_blank" 
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-medium hover:opacity-90 transition-all shadow-sm"
                                                                    >
                                                                        <FileText size={13} /> PDF Document
                                                                    </a>
                                                                )}
                                                                {paper.links.code && (
                                                                    <a 
                                                                        href={paper.links.code} 
                                                                        target="_blank" 
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-mono font-medium transition-all"
                                                                    >
                                                                        <Github size={13} /> Code Repository
                                                                    </a>
                                                                )}
                                                                {paper.links.video && (
                                                                    <a 
                                                                        href={paper.links.video} 
                                                                        target="_blank" 
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted text-xs font-mono font-medium transition-all"
                                                                    >
                                                                        <Mic size={13} /> Presentation Video
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* SECTION: ADVISORY & EXITS */}
                        <section id="advisory" className="scroll-mt-28 space-y-10">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary font-semibold">Startup Exits</span>
                                    <h2 className="font-display text-3xl font-bold tracking-tight">Advisory Work</h2>
                                </div>
                                <p className="text-sm text-muted-foreground max-w-2xl">
                                    Advising high-potential technology startups on applying state-of-the-art computer vision and information retrieval models.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-6">
                                <div className="editorial-card p-6 bg-card/40 backdrop-blur-sm flex flex-col justify-between gap-6 hover:border-primary/40 transition-all">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono font-semibold text-primary uppercase">Acquired</span>
                                            <span className="text-xs text-muted-foreground font-mono">Paris, FR</span>
                                        </div>
                                        <h3 className="font-display font-bold text-xl">Monk AI</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Scientific advisor. Built damage detection models using Mask R-CNN. Acquired by ACV Auctions.
                                        </p>
                                    </div>
                                    <a href="https://monk.ai/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-mono font-semibold hover:text-primary transition-all">
                                        Visit Monk AI <ArrowUpRight size={13} />
                                    </a>
                                </div>

                                <div className="editorial-card p-6 bg-card/40 backdrop-blur-sm flex flex-col justify-between gap-6 hover:border-primary/40 transition-all">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono font-semibold text-primary uppercase">Acquired</span>
                                            <span className="text-xs text-muted-foreground font-mono">Paris, FR</span>
                                        </div>
                                        <h3 className="font-display font-bold text-xl">Brainattic</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Scientific advisor. Researched information retrieval in video streams and automatic trailer generation using Deep Learning. Acquired by Master The Monster.
                                        </p>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground uppercase">Acquisition Complete</span>
                                </div>

                                <div className="editorial-card p-6 bg-card/40 backdrop-blur-sm flex flex-col justify-between gap-6 hover:border-primary/40 transition-all">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="px-2 py-0.5 rounded bg-academic/10 border border-academic/20 text-[10px] font-mono font-semibold text-academic uppercase">Active</span>
                                            <span className="text-xs text-muted-foreground font-mono">Vancouver, CA</span>
                                        </div>
                                        <h3 className="font-display font-bold text-xl">EyeCareX</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Scientific advisor. Developing AI-enabled at-home eye tests connected to remote optometrists.
                                        </p>
                                    </div>
                                    <a href="https://www.eyecarex.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-mono font-semibold hover:text-primary transition-all">
                                        Visit EyeCareX <ArrowUpRight size={13} />
                                    </a>
                                </div>
                            </div>
                        </section>

                        {/* SECTION: SKILLS & SOFTWARE */}
                        <section id="skills" className="scroll-mt-28 space-y-10">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary font-semibold">Expertise</span>
                                    <h2 className="font-display text-3xl font-bold tracking-tight">Skills & Open Source</h2>
                                </div>
                                <p className="text-sm text-muted-foreground max-w-2xl">
                                    Core programming competencies and mathematical frameworks developed through research and production environments.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-[1fr_2fr] gap-6">
                                <div className="editorial-card p-6 bg-card/40 backdrop-blur-sm flex flex-col justify-between gap-6">
                                    <div className="space-y-3">
                                        <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono font-semibold text-primary uppercase">Open Source</span>
                                        <h3 className="font-display font-bold text-xl">saemix</h3>
                                        <p className="text-xs text-muted-foreground font-mono">R Package Development</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            R package for maximum likelihood estimation of parameters in nonlinear mixed effect models using Stochastic Approximation EM (SAEM).
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href="https://github.com/saemixr" target="_blank" rel="noreferrer" className="p-2.5 rounded-lg bg-card hover:bg-muted border border-border/80 text-muted-foreground hover:text-foreground transition-all">
                                            <Github size={14} />
                                        </a>
                                        <a href="https://saemixr.github.io/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card hover:bg-muted border border-border text-xs font-mono font-semibold text-muted-foreground hover:text-foreground transition-all">
                                            Web docs <ArrowUpRight size={13} />
                                        </a>
                                    </div>
                                </div>

                                <div className="editorial-card p-6 bg-card/40 backdrop-blur-sm grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h4 className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">Research Core</h4>
                                        <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                                            <li>Non-convex optimization</li>
                                            <li>Langevin dynamics (MCMC)</li>
                                            <li>Federated & Distributed Learning</li>
                                            <li>Energy-Based Modeling (EBMs)</li>
                                            <li>Bayesian neural network solvers</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">Applied Engineering</h4>
                                        <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                                            <li>Generative AI Pipelines</li>
                                            <li>Semantic Search & Ranking</li>
                                            <li>PyTorch, JAX, TensorFlow</li>
                                            <li>Statistical modeling (R, Python)</li>
                                            <li>GPU kernels (FeatureBox)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION: TALKS & TEACHING */}
                        <section id="talks" className="scroll-mt-28 space-y-10">
                            <div className="space-y-2">
                                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary font-semibold">Community & Academy</span>
                                <h2 className="font-display text-3xl font-bold tracking-tight">Talks & Lectures</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-display font-bold text-xl text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                                        <BookOpen size={16} className="text-primary" /> Teaching & Seminars
                                    </h3>
                                    <div className="space-y-3">
                                        {teaching.map((t, idx) => (
                                            <div key={idx} className="p-3.5 rounded-lg bg-card/30 border border-border/50 text-sm flex justify-between gap-4">
                                                <span className="font-semibold">{t.course}</span>
                                                <span className="text-xs font-mono text-muted-foreground self-center shrink-0">{t.role}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-display font-bold text-xl text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                                        <Mic size={16} className="text-primary" /> Presentation Highlights
                                    </h3>
                                    <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                        {talks.map((talk, idx) => (
                                            <div key={idx} className="p-3.5 rounded-lg bg-card/30 border border-border/50 space-y-1.5">
                                                <div className="flex justify-between items-start gap-4">
                                                    <h4 className="font-bold text-sm leading-tight text-foreground">{talk.title}</h4>
                                                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                        {talk.date}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                                                    <span>{talk.venue} · {talk.location}</span>
                                                    {talk.links?.slides && (
                                                        <a href={talk.links.slides} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 hover:text-primary transition-colors">
                                                            Slides <ArrowUpRight size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION: MUSIC */}
                        <section id="music" className="scroll-mt-28 space-y-10">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary font-semibold">Sound alias: Lalbe</span>
                                    <h2 className="font-display text-3xl font-bold tracking-tight">Creative Dimensions</h2>
                                </div>
                                <p className="text-sm text-muted-foreground max-w-2xl">
                                    Beyond machine learning, I produce house and soulful music under the alias <span className="text-foreground font-semibold">Lalbe</span>. Here are some of my productions and curated sets.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-[2fr_1fr] gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-display font-bold text-xl text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                                        <Music size={16} className="text-primary" /> Audio Productions
                                    </h3>
                                    <div className="space-y-4">
                                        {production.map((track, idx) => (
                                            <div key={idx} className="editorial-card p-4 bg-card/40 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground">{track.title}</h4>
                                                    <p className="text-xs text-muted-foreground font-mono">Artist: {track.artist}</p>
                                                </div>
                                                <a 
                                                    href={track.link} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono font-medium hover:text-primary transition-all self-start sm:self-auto"
                                                >
                                                    Listen on SoundCloud <ArrowUpRight size={12} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-display font-bold text-xl text-foreground flex items-center gap-2 border-b border-border/40 pb-2">
                                        Curated Playlists
                                    </h3>
                                    <div className="space-y-3">
                                        {playlists.map((playlist, idx) => (
                                            <div key={idx} className="p-3.5 rounded-lg bg-card/30 border border-border/50 space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-bold text-sm">{playlist.title}</h4>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{playlist.duration}</span>
                                                </div>
                                                <a 
                                                    href={playlist.link} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-0.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    Open Spotify <ArrowUpRight size={11} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                    </main>
                </div>
            </div>

            {/* --- FOOTER --- */}
            <footer className="border-t border-border/40 py-12 bg-card/20 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
                    <p>© {new Date().getFullYear()} {bio.name}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
