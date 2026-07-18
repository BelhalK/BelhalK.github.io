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
        { id: 'highlights', label: 'Highlights', icon: Target },
        { id: 'toolbox', label: 'Toolbox', icon: Laptop },
        { id: 'experience', label: 'Timeline', icon: Briefcase },
        { id: 'research', label: 'Publications', icon: FileText },
        { id: 'advisory', label: 'Advisory', icon: Cpu },
        { id: 'talks', label: 'Talks & Lectures', icon: Mic },
        { id: 'music', label: 'Creative', icon: Music },
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
        <div className="min-h-screen text-ink bg-background transition-colors duration-300 relative selection:bg-accent/10 selection:text-accent">
            {/* Ambient Background Grid Overlay (inspired by tangvu.dev) */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-background transition-colors duration-300">
                <div 
                    aria-hidden="true" 
                    className="absolute inset-0 opacity-[0.4] dark:opacity-[0.25] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" 
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #d9d9d4 1.5px, transparent 0)`,
                        backgroundSize: '22px 22px'
                    }}
                />
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full blur-[140px] opacity-[0.06] dark:opacity-[0.12] bg-accent pointer-events-none" />
                <div className="absolute bottom-20 left-0 w-[35vw] h-[35vw] rounded-full blur-[120px] opacity-[0.04] dark:opacity-[0.08] bg-award pointer-events-none" />
            </div>

            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md transition-colors duration-300">
                <nav className="container-page flex h-16 items-center justify-between">
                    <a 
                        href="#top" 
                        onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                        className="flex items-center gap-2.5 font-display text-[0.95rem] font-bold tracking-tight"
                    >
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-ink font-mono text-[0.7rem] font-bold text-paper">BK</span>
                        <span className="hidden sm:inline text-ink">{bio.name}</span>
                    </a>
                    
                    <div className="hidden items-center gap-6 md:flex">
                        {sections.map((s) => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                onClick={(e) => { e.preventDefault(); scrollToSection(s.id); }}
                                className={`link-underline text-xs font-semibold uppercase tracking-wider transition-colors hover:text-accent ${
                                    activeSection === s.id ? 'text-accent' : 'text-muted'
                                }`}
                            >
                                {s.label}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-panel text-muted hover:text-ink transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        
                        <a 
                            href={`mailto:${bio.email}`}
                            className="hidden sm:inline-block rounded-full border border-line bg-ink px-4 py-1.5 text-xs font-medium text-paper transition-transform hover:-translate-y-0.5"
                        >
                            Get in touch
                        </a>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-panel text-muted hover:text-ink transition-colors"
                            aria-label="Open menu"
                        >
                            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </nav>
            </header>

            {/* Mobile Nav Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-x-0 top-16 z-40 bg-paper border-b border-line p-6 flex flex-col gap-3 shadow-lg md:hidden"
                    >
                        {sections.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => scrollToSection(s.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                                    activeSection === s.id 
                                        ? 'bg-accent/10 text-accent' 
                                        : 'hover:bg-panel text-muted hover:text-ink'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                        <a 
                            href={`mailto:${bio.email}`}
                            className="mt-2 text-center rounded-lg bg-ink py-3 text-sm font-semibold text-paper"
                        >
                            Get in touch
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- HERO / TOP --- */}
            <section id="about" className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-line">
                <div className="container-page">
                    <div className="grid items-start gap-12 lg:grid-cols-[1.6fr_1fr]">
                        {/* Hero Info */}
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold text-muted">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
                                </span>
                                {bio.role} @ {bio.company}
                            </span>
                            
                            <h1 className="mt-6 font-display text-[clamp(2.5rem,7vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.03em] text-ink">
                                {bio.name}
                            </h1>
                            
                            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                                I design, model, and deploy production ML systems. Currently leading generative AI search matching & ranking at <span className="text-ink font-semibold">Nike</span>, with an academic foundation in optimization theory and federated learning.
                            </p>
                            
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <a 
                                    href={`mailto:${bio.email}`} 
                                    className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-paper shadow-sm transition-transform hover:-translate-y-0.5"
                                >
                                    Get in touch
                                </a>
                                <a 
                                    href={bio.socials.scholar} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink hover:bg-panel transition-all"
                                >
                                    Google Scholar ↗
                                </a>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-faint">
                                <a href={bio.socials.github} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-ink">GitHub</a>
                                <a href={bio.socials.linkedin} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-ink">LinkedIn</a>
                                <a href={bio.socials.twitter} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-ink">Twitter / X</a>
                                <a href={bio.socials.soundcloud} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-ink">SoundCloud</a>
                                <a href={bio.socials.instagram} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-ink">Instagram</a>
                            </div>
                        </div>

                        {/* Whoami Sidebar Card */}
                        <aside className="rounded-2xl border border-line bg-panel/60 p-6 backdrop-blur-sm shadow-soft">
                            <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-faint">// whoami</p>
                            <dl className="mt-4 divide-y divide-line">
                                <div className="flex items-baseline justify-between gap-4 py-3">
                                    <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-faint">Status</dt>
                                    <dd className="flex items-center gap-2 text-right text-sm font-semibold text-ink">
                                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></span>
                                        Principal Scientist
                                    </dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-4 py-3">
                                    <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-faint">Location</dt>
                                    <dd className="text-right text-sm font-semibold text-ink">{bio.location}</dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-4 py-3">
                                    <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-faint">Focus</dt>
                                    <dd className="text-right text-sm font-semibold text-ink">GenAI · Ranking · Optimization</dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-4 py-3">
                                    <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-faint">Flagship</dt>
                                    <dd className="text-right text-sm font-semibold text-ink">Nike App Search Engine</dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-4 py-3">
                                    <dt className="font-mono text-[0.7rem] uppercase tracking-wider text-faint">Academic</dt>
                                    <dd className="text-right text-sm font-semibold text-ink">Ph.D. Polytechnique & INRIA</dd>
                                </div>
                            </dl>
                        </aside>
                    </div>

                    {/* Stats Dashboard */}
                    <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
                        <div className="bg-paper px-5 py-6">
                            <dt className="font-display text-3xl font-bold tracking-tight sm:text-4xl">15+</dt>
                            <dd className="mt-1 text-sm font-semibold text-ink">Core Publications</dd>
                            <dd className="text-xs text-faint">ICLR, NeurIPS, UAI, COLT</dd>
                        </div>
                        <div className="bg-paper px-5 py-6">
                            <dt className="font-display text-3xl font-bold tracking-tight sm:text-4xl">2</dt>
                            <dd className="mt-1 text-sm font-semibold text-ink">Advisory Exits</dd>
                            <dd className="text-xs text-faint">Monk AI & Brainattic</dd>
                        </div>
                        <div className="bg-paper px-5 py-6">
                            <dt className="font-display text-3xl font-bold tracking-tight sm:text-4xl">10+</dt>
                            <dd className="mt-1 text-sm font-semibold text-ink">Years Building</dd>
                            <dd className="text-xs text-faint">industry & academic ML</dd>
                        </div>
                        <div className="bg-paper px-5 py-6">
                            <dt className="font-display text-3xl font-bold tracking-tight sm:text-4xl">1</dt>
                            <dd className="mt-1 text-sm font-semibold text-ink">Open Source Package</dd>
                            <dd className="text-xs text-faint">saemix developer</dd>
                        </div>
                    </dl>
                </div>
            </section>

            {/* --- SECTION 01: ABOUT EXPANDED --- */}
            <section className="py-20 border-b border-line">
                <div className="container-page">
                    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <p className="eyebrow">01 / About</p>
                            <h2 className="section-title mt-3">A researcher who builds at scale.</h2>
                        </div>
                        <div className="space-y-6">
                            <p className="text-xl leading-relaxed text-muted font-medium">
                                I specialize in connecting the mathematical rigor of machine learning models with real-world, high-traffic consumer experiences.
                            </p>
                            <p className="leading-relaxed text-muted">
                                From leading Generative AI matching, retrieval, and ranking algorithms at <span className="font-semibold text-ink">Nike</span> to researching federated learning and non-convex optimization at elite international institutions (<span className="font-semibold text-ink">Polytechnique, INRIA, MIT, Baidu Research</span>), I ensure complex pipelines deliver accurate results with fast response times.
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 grid gap-5 md:grid-cols-3">
                        <article className="group rounded-2xl border border-line bg-panel/60 p-6 transition-all hover:border-accent/30 hover:shadow-soft">
                            <span className="font-mono text-xs text-accent">01</span>
                            <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">Industry & GenAI</h3>
                            <p className="mt-2.5 text-sm leading-relaxed text-muted">
                                Overseeing Generative AI, product discovery search matching, and personalization ranking algorithms behind Nike app and Nike.com.
                            </p>
                        </article>
                        <article className="group rounded-2xl border border-line bg-panel/60 p-6 transition-all hover:border-accent/30 hover:shadow-soft">
                            <span className="font-mono text-xs text-accent">02</span>
                            <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">Mathematical Theory</h3>
                            <p className="mt-2.5 text-sm leading-relaxed text-muted">
                                Deep expertise in non-convex stochastic gradient convergence, Langevin dynamics, MCMC algorithms, and federated optimization.
                            </p>
                        </article>
                        <article className="group rounded-2xl border border-line bg-panel/60 p-6 transition-all hover:border-accent/30 hover:shadow-soft">
                            <span className="font-mono text-xs text-accent">03</span>
                            <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">Advisory & Exits</h3>
                            <p className="mt-2.5 text-sm leading-relaxed text-muted">
                                Scientific advisor guiding startups through engineering milestones, leading to acquisitions by ACV Auctions and Master The Monster.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            {/* --- SECTION 02: HIGHLIGHTS MATRIX --- */}
            <section id="highlights" className="py-20 border-b border-line bg-panel/30">
                <div className="container-page">
                    <p className="eyebrow">02 / Highlights</p>
                    <h2 className="section-title mt-3">Strategic Accomplishments</h2>
                    
                    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="rounded-xl border border-line bg-paper p-6 border-l-4 border-l-accent flex flex-col justify-between h-44 shadow-soft">
                            <span className="text-xs font-mono text-faint uppercase tracking-wider">Nike Leadership</span>
                            <p className="text-sm font-semibold leading-snug text-ink">Led GenAI product discovery & search relevance rankings for multi-platform customer channels.</p>
                        </div>
                        <div className="rounded-xl border border-line bg-paper p-6 border-l-4 border-l-award flex flex-col justify-between h-44 shadow-soft">
                            <span className="text-xs font-mono text-faint uppercase tracking-wider">Core Research</span>
                            <p className="text-sm font-semibold leading-snug text-ink">15+ papers in top-tier conferences (NeurIPS, ICLR, UAI, ACML, COLT) focusing on optimization.</p>
                        </div>
                        <div className="rounded-xl border border-line bg-paper p-6 border-l-4 border-l-accent flex flex-col justify-between h-44 shadow-soft">
                            <span className="text-xs font-mono text-faint uppercase tracking-wider">M&A Outcomes</span>
                            <p className="text-sm font-semibold leading-snug text-ink">Advisor for Monk AI (acquired by ACV Auctions) and Brainattic (acquired by Master The Monster).</p>
                        </div>
                        <div className="rounded-xl border border-line bg-paper p-6 border-l-4 border-l-award flex flex-col justify-between h-44 shadow-soft">
                            <span className="text-xs font-mono text-faint uppercase tracking-wider">Institutions</span>
                            <p className="text-sm font-semibold leading-snug text-ink">Ph.D. from Ecole Polytechnique & INRIA; visiting scholar at MIT and interned at Samsung AI.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 03: TOOLBOX --- */}
            <section id="toolbox" className="py-20 border-b border-line">
                <div className="container-page">
                    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <p className="eyebrow">03 / Toolbox</p>
                            <h2 className="section-title mt-3">The stack I reach for.</h2>
                            <p className="mt-4 text-sm text-muted">A spectrum of theoretical research toolkits alongside robust engineering frameworks.</p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-faint">
                                    <span className="h-px w-4 bg-accent"></span>Research Core
                                </h3>
                                <ul className="mt-3 flex flex-wrap gap-1.5">
                                    {['Non-convex optimization', 'Langevin dynamics', 'MCMC', 'Federated Learning', 'Energy-Based Models', 'Bayesian neural network solvers'].map((item) => (
                                        <li key={item} className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-ink font-semibold">{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-faint">
                                    <span className="h-px w-4 bg-accent"></span>Applied Engineering
                                </h3>
                                <ul className="mt-3 flex flex-wrap gap-1.5">
                                    {['Generative AI Pipelines', 'Information Retrieval', 'Semantic Search', 'PyTorch', 'JAX', 'TensorFlow', 'GPU kernels'].map((item) => (
                                        <li key={item} className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-ink font-semibold">{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-faint">
                                    <span className="h-px w-4 bg-accent"></span>Languages
                                </h3>
                                <ul className="mt-3 flex flex-wrap gap-1.5">
                                    {['Python', 'R', 'C / C++', 'SQL', 'Bash', 'JavaScript'].map((item) => (
                                        <li key={item} className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-ink font-semibold">{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-faint">
                                    <span className="h-px w-4 bg-accent"></span>Open Source
                                </h3>
                                <ul className="mt-3 flex flex-wrap gap-1.5">
                                    <li className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-ink font-semibold">saemix developer (R package)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 04: EXPERIENCE TIMELINE --- */}
            <section id="experience" className="py-20 border-b border-line bg-panel/30">
                <div className="container-page">
                    <p className="eyebrow">04 / Journey</p>
                    <h2 className="section-title mt-3">Where I've been building.</h2>

                    <div className="mt-12 relative border-l border-line ml-4 space-y-12">
                        {industry.map((role, idx) => (
                            <div key={idx} className="relative pl-8 group">
                                <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border border-line bg-background group-hover:border-accent group-hover:bg-accent transition-all duration-300" />
                                
                                <div className="grid md:grid-cols-[1fr_2fr] gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-display font-bold text-lg text-ink group-hover:text-accent transition-colors">
                                                {role.company}
                                            </h3>
                                            {role.link && (
                                                <a href={role.link} target="_blank" rel="noopener noreferrer" className="text-faint hover:text-accent transition-colors">
                                                    <ArrowUpRight size={14} />
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-xs font-mono text-accent font-bold uppercase tracking-wider mt-0.5">
                                            {role.role}
                                        </p>
                                        <p className="text-xs font-mono text-faint flex items-center gap-1 mt-1">
                                            <MapPin size={10} /> {role.location}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted leading-relaxed">
                                            {role.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- SECTION 05: PUBLICATIONS --- */}
            <section id="research" className="py-20 border-b border-line">
                <div className="container-page">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="eyebrow">05 / Publications</p>
                            <h2 className="section-title mt-3">Research Hub</h2>
                        </div>
                        <div className="flex flex-wrap gap-2 pb-2">
                            {['All', 'Generative & EBMs', 'Federated Learning', 'Optimization'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => {
                                        setPaperFilter(filter);
                                        setExpandedPaper(null);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                                        paperFilter === filter 
                                            ? 'bg-accent text-paper font-semibold shadow-sm' 
                                            : 'bg-panel hover:bg-line text-muted hover:text-ink border border-line'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-10 space-y-4">
                        {getFilteredPapers().map((paper, idx) => {
                            const isExpanded = expandedPaper === idx;
                            return (
                                <div 
                                    key={idx}
                                    className={`rounded-2xl border transition-all duration-300 bg-paper ${
                                        isExpanded ? 'border-accent/40 shadow-soft ring-1 ring-accent/5' : 'border-line'
                                    }`}
                                >
                                    <div 
                                        onClick={() => setExpandedPaper(isExpanded ? null : idx)}
                                        className="p-5 flex items-start gap-4 cursor-pointer select-none"
                                    >
                                        <div className="hidden sm:grid place-items-center h-8 w-8 rounded-lg bg-panel text-xs font-mono font-semibold text-faint">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-grow space-y-1 min-w-0">
                                            <h3 className="font-display font-bold text-base md:text-lg text-ink hover:text-accent transition-colors leading-snug">
                                                {paper.title}
                                            </h3>
                                            <p className="text-xs text-muted font-mono truncate">
                                                {paper.authors}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent/15 text-[10px] font-mono font-semibold">
                                                    {paper.venue}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-faint self-center">
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="border-t border-line bg-panel/30 overflow-hidden"
                                            >
                                                <div className="p-5 space-y-6">
                                                    {paper.abstract && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">Abstract</h4>
                                                            <p className="text-sm text-muted leading-relaxed">
                                                                {paper.abstract}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">BibTeX Citation</h4>
                                                            <button 
                                                                onClick={() => handleCopyBibtex(paper, idx)}
                                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-paper hover:bg-panel border border-line text-[10px] font-mono hover:text-accent transition-colors"
                                                            >
                                                                {copiedPaper === idx ? (
                                                                    <>
                                                                        <Check size={11} className="text-accent" /> Copied
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy size={11} /> Copy BibTeX
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                        <pre className="p-4 rounded-lg bg-paper border border-line font-mono text-xs overflow-x-auto text-muted whitespace-pre select-all no-scrollbar">
                                                            {generateBibtex(paper)}
                                                        </pre>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {paper.links.pdf && (
                                                            <a 
                                                                href={paper.links.pdf} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-paper text-xs font-mono font-semibold hover:opacity-90 transition-all shadow-sm"
                                                            >
                                                                <FileText size={13} /> PDF Document
                                                            </a>
                                                        )}
                                                        {paper.links.code && (
                                                            <a 
                                                                href={paper.links.code} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-paper border border-line hover:bg-panel text-xs font-mono font-semibold transition-all"
                                                            >
                                                                <Github size={13} /> Code Repository
                                                            </a>
                                                        )}
                                                        {paper.links.video && (
                                                            <a 
                                                                href={paper.links.video} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-paper border border-line hover:bg-panel text-xs font-mono font-semibold transition-all"
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
                </div>
            </section>

            {/* --- SECTION 06: ADVISORY --- */}
            <section id="advisory" className="py-20 border-b border-line bg-panel/30">
                <div className="container-page">
                    <p className="eyebrow">06 / Advisory</p>
                    <h2 className="section-title mt-3">Exits & Consultations</h2>
                    <p className="mt-4 text-sm text-muted max-w-xl">
                        Scientific advisor guiding artificial intelligence, computer vision, and predictive analytics startups through critical architectures.
                    </p>

                    <div className="mt-10 grid sm:grid-cols-3 gap-6">
                        <div className="rounded-2xl border border-line bg-paper p-6 flex flex-col justify-between gap-6 hover:border-accent/40 transition-all shadow-soft">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="px-2 py-0.5 rounded bg-accent-soft border border-accent/20 text-[10px] font-mono font-semibold text-accent uppercase">Acquired</span>
                                    <span className="text-xs text-faint font-mono">Paris, FR</span>
                                </div>
                                <h3 className="font-display font-bold text-xl text-ink">Monk AI</h3>
                                <p className="text-sm text-muted leading-relaxed">
                                    Built object damage detection models using Mask R-CNN. Acquired by ACV Auctions.
                                </p>
                            </div>
                            <a href="https://monk.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-mono font-semibold text-accent hover:underline">
                                Visit Monk AI <ArrowUpRight size={13} />
                            </a>
                        </div>

                        <div className="rounded-2xl border border-line bg-paper p-6 flex flex-col justify-between gap-6 hover:border-accent/40 transition-all shadow-soft">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="px-2 py-0.5 rounded bg-accent-soft border border-accent/20 text-[10px] font-mono font-semibold text-accent uppercase">Acquired</span>
                                    <span className="text-xs text-faint font-mono">Paris, FR</span>
                                </div>
                                <h3 className="font-display font-bold text-xl text-ink">Brainattic</h3>
                                <p className="text-sm text-muted leading-relaxed">
                                    Researched video-based information retrieval and automated summary clip generators. Acquired by Master The Monster.
                                </p>
                            </div>
                            <span className="text-xs font-mono text-faint uppercase tracking-wider">Acquisition Complete</span>
                        </div>

                        <div className="rounded-2xl border border-line bg-paper p-6 flex flex-col justify-between gap-6 hover:border-accent/40 transition-all shadow-soft">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="px-2 py-0.5 rounded bg-award-soft border border-award/25 text-[10px] font-mono font-semibold text-award uppercase">Active</span>
                                    <span className="text-xs text-faint font-mono">Vancouver, CA</span>
                                </div>
                                <h3 className="font-display font-bold text-xl text-ink">EyeCareX</h3>
                                <p className="text-sm text-muted leading-relaxed">
                                    Co-developing proprietary AI diagnostics for remote optometry and clinical eye tests.
                                </p>
                            </div>
                            <a href="https://www.eyecarex.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-mono font-semibold text-accent hover:underline">
                                Visit EyeCareX <ArrowUpRight size={13} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 07: TALKS & TEACHING --- */}
            <section id="talks" className="py-20 border-b border-line">
                <div className="container-page">
                    <p className="eyebrow">07 / Academy</p>
                    <h2 className="section-title mt-3">Talks & Lectures</h2>

                    <div className="mt-12 grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-display font-bold text-xl text-ink flex items-center gap-2 border-b border-line pb-2">
                                <BookOpen size={16} className="text-accent" /> Teaching & Seminars
                            </h3>
                            <div className="space-y-3">
                                {teaching.map((t, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-panel/40 border border-line text-sm flex justify-between gap-4">
                                        <span className="font-bold text-ink">{t.course}</span>
                                        <span className="text-xs font-mono text-muted self-center shrink-0">{t.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-display font-bold text-xl text-ink flex items-center gap-2 border-b border-line pb-2">
                                <Mic size={16} className="text-accent" /> Presentations
                            </h3>
                            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                                {talks.map((talk, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-panel/40 border border-line space-y-1.5">
                                        <div className="flex justify-between items-start gap-4">
                                            <h4 className="font-bold text-sm leading-tight text-ink">{talk.title}</h4>
                                            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent/15 shrink-0">
                                                {talk.date}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-muted font-mono">
                                            <span>{talk.venue} · {talk.location}</span>
                                            {talk.links?.slides && (
                                                <a href={talk.links.slides} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-accent transition-colors">
                                                    Slides <ArrowUpRight size={10} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 08: CREATIVE --- */}
            <section id="music" className="py-20 border-b border-line bg-panel/30">
                <div className="container-page">
                    <p className="eyebrow">08 / Creative</p>
                    <h2 className="section-title mt-3">House & Soul: Lalbe</h2>
                    <p className="mt-4 text-sm text-muted max-w-xl">
                        Outside of machine learning theory, I write and release music under the moniker <span className="text-ink font-semibold">Lalbe</span>, focusing on deep house and soulful tracks.
                    </p>

                    <div className="mt-12 grid md:grid-cols-[1.6fr_1fr] gap-8">
                        <div className="space-y-4">
                            <h3 className="font-display font-bold text-xl text-ink flex items-center gap-2 border-b border-line pb-2">
                                <Music size={16} className="text-accent" /> Track Releases
                            </h3>
                            <div className="space-y-3">
                                {production.map((track, idx) => (
                                    <div key={idx} className="rounded-xl border border-line bg-paper p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
                                        <div>
                                            <h4 className="font-bold text-sm text-ink">{track.title}</h4>
                                            <p className="text-xs text-faint font-mono">Artist: {track.artist}</p>
                                        </div>
                                        <a 
                                            href={track.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-panel border border-line text-xs font-mono font-semibold text-ink hover:text-accent transition-all self-start sm:self-auto"
                                        >
                                            SoundCloud <ArrowUpRight size={12} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-display font-bold text-xl text-ink flex items-center gap-2 border-b border-line pb-2">
                                Spotify Playlists
                            </h3>
                            <div className="space-y-3">
                                {playlists.map((playlist, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-paper border border-line space-y-1 shadow-soft">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-sm text-ink">{playlist.title}</h4>
                                            <span className="text-[10px] font-mono text-faint">{playlist.duration}</span>
                                        </div>
                                        <a 
                                            href={playlist.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-0.5 text-xs font-mono text-muted hover:text-accent transition-colors"
                                        >
                                            Spotify <ArrowUpRight size={11} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 bg-paper transition-colors duration-300">
                <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-faint">
                    <p>© {new Date().getFullYear()} {bio.name}. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a href={bio.socials.github} target="_blank" rel="noopener noreferrer" className="hover:text-ink">GitHub</a>
                        <a href={bio.socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-ink">LinkedIn</a>
                        <a href={`mailto:${bio.email}`} className="hover:text-ink">Email</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
