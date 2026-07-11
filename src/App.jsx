import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import Research from './components/Research';
import Software from './components/Software';
import Talks from './components/Talks';
import Industry from './components/Industry';
import Advisory from './components/Advisory';
import Awards from './components/Awards';
import Teaching from './components/Teaching';
import Education from './components/Education';
import MusicSection from './components/MusicSection';
import { bio } from './data/bio';

const Background = () => {
    const reduce = useReducedMotion();
    return (
        <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* warm paper base */}
            <div className="absolute inset-0 bg-background" />
            {/* soft radial wash */}
            <div
                className="absolute inset-0 opacity-80"
                style={{
                    background:
                        'radial-gradient(120% 80% at 80% -10%, hsl(272 30% 94% / 0.7) 0%, transparent 55%), radial-gradient(90% 60% at -10% 30%, hsl(250 25% 91% / 0.4) 0%, transparent 50%)',
                }}
            />
            {/* floating orbs */}
            <div
                className={`absolute -top-24 right-[8%] h-[26rem] w-[26rem] rounded-full blur-3xl ${reduce ? '' : 'animate-drift'}`}
                style={{ background: 'radial-gradient(circle at 30% 30%, hsl(272 40% 60% / 0.16), transparent 65%)' }}
            />
            <div
                className={`absolute top-[40%] -left-24 h-[22rem] w-[22rem] rounded-full blur-3xl ${reduce ? '' : 'animate-float'}`}
                style={{ background: 'radial-gradient(circle at 60% 40%, hsl(255 45% 70% / 0.12), transparent 65%)' }}
            />
            <div
                className={`absolute bottom-[-8%] right-[20%] h-[20rem] w-[20rem] rounded-full blur-3xl ${reduce ? '' : 'animate-drift'}`}
                style={{ background: 'radial-gradient(circle at 50% 50%, hsl(280 35% 75% / 0.1), transparent 65%)' }}
            />
            {/* fine grid */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, hsl(220 18% 14%) 1px, transparent 1px), linear-gradient(to bottom, hsl(220 18% 14%) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                    maskImage: 'radial-gradient(120% 90% at 50% 0%, black 30%, transparent 75%)',
                    WebkitMaskImage: 'radial-gradient(120% 90% at 50% 0%, black 30%, transparent 75%)',
                }}
            />
            {/* paper grain */}
            <div className="absolute inset-0 grain opacity-[0.035] mix-blend-multiply" />
        </div>
    );
};

const App = () => {
    const [activeTab, setActiveTabState] = useState('about');
    const reduce = useReducedMotion();

    const setActiveTab = (tab) => {
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        setActiveTabState(tab);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'about': return <Hero setActiveTab={setActiveTab} />;
            case 'research': return <Research />;
            case 'software': return <Software />;
            case 'talks': return <Talks />;
            case 'industry': return <Industry />;
            case 'advisory': return <Advisory />;
            case 'awards': return <Awards />;
            case 'teaching': return <Teaching />;
            case 'education': return <Education />;
            case 'music': return <MusicSection />;
            default: return <Hero setActiveTab={setActiveTab} />;
        }
    };

    const pageVariants = reduce
        ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
        : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

    return (
        <div className="min-h-screen text-foreground font-sans selection:bg-primary selection:text-white overflow-x-hidden">
            <Background />
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className={`w-full max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12 pb-24 min-h-screen flex flex-col ${activeTab === 'about' ? 'pt-28 md:pt-36' : 'pt-20 md:pt-24'}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-grow"
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <footer className="relative pb-10 pt-6">
                <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12">
                    <div className="border-t border-border/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} {bio.name}</p>
                        <p className="font-mono text-xs tracking-wide uppercase">{bio.role} · {bio.company}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;
