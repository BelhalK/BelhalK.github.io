import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import Research from './components/Research';
import Software from './components/Software';
import Talks from './components/Talks';
import Industry from './components/Industry';
import Awards from './components/Awards';
import Teaching from './components/Teaching';
import Education from './components/Education';
import MusicSection from './components/MusicSection';
import { bio } from './data/bio';

const App = () => {
    const [activeTab, setIsActiveTab] = useState('about');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const setActiveTab = (tab) => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        setIsActiveTab(tab);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'about': return <Hero setActiveTab={setActiveTab} />;
            case 'research': return <Research />;
            case 'software': return <Software />;
            case 'talks': return <Talks />;
            case 'industry': return <Industry />;
            case 'awards': return <Awards />;
            case 'teaching': return <Teaching />;
            case 'education': return <Education />;
            case 'music': return <MusicSection />;
            default: return <Hero setActiveTab={setActiveTab} />;
        }
    };

    return (
        <div className="min-h-screen text-foreground font-sans selection:bg-primary selection:text-white overflow-x-hidden">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Seamless Layout: Wider container, fluid margins */}
            <main className="w-full max-w-[1600px] mx-auto px-6 md:px-12 pt-20 md:pt-32 pb-24 min-h-screen flex flex-col">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex-grow"
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <footer className="py-8 text-center mt-auto">
                <div className="w-full max-w-[1600px] mx-auto px-6 text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} {bio.name}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default App;
