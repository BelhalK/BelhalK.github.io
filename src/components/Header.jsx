import React from 'react';
import { motion } from 'framer-motion';
import { User, FileText, Mic, Briefcase, Music, Laptop, Award, BookOpen, GraduationCap } from 'lucide-react';

const navItems = [
    { id: 'about', label: 'About', icon: User },
    { id: 'research', label: 'Research', icon: FileText },
    { id: 'talks', label: 'Talks', icon: Mic },
    { id: 'industry', label: 'Industry', icon: Briefcase },
    { id: 'software', label: 'Software', icon: Laptop },
    { id: 'awards', label: 'Awards', icon: Award },
    { id: 'teaching', label: 'Teaching', icon: BookOpen },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'music', label: 'Music', icon: Music },
];

const Header = ({ activeTab, setActiveTab }) => {
    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
        >
            <nav className="bg-white rounded-full px-2 py-2 flex items-center gap-1 md:gap-2 overflow-x-auto max-w-[95vw] no-scrollbar border-2 border-gray-900">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`relative px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200 outline-none select-none
                                ${isActive ? 'text-white' : 'text-gray-900 [@media(hover:hover)]:hover:text-white [@media(hover:hover)]:hover:bg-primary'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary rounded-full"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon size={16} />
                                <span className="text-sm font-medium hidden md:block">{item.label}</span>
                            </span>
                        </button>
                    );
                })}
            </nav>
        </motion.header>
    );
};

export default Header;
