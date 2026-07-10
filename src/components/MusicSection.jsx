import React from 'react';
import { motion } from 'framer-motion';
import { playlists, production } from '../data/music';
import { Disc, Music, Headphones } from 'lucide-react';
import SectionHeader from './SectionHeader';

const MusicSection = () => {
    return (
        <section className="space-y-16">
            <SectionHeader
                title="Music"
                subtitle="Curated playlists and original productions. Sonic explorations."
            />

            <div className="grid md:grid-cols-2 gap-12">
                {/* Produced */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <Disc size={24} />
                        <h3 className="text-2xl font-display font-bold">Original Production</h3>
                    </div>
                    <div className="space-y-4">
                        {production.map((track, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-xl overflow-hidden glass-card hover:border-primary/50 transition-colors"
                            >
                                <iframe
                                    width="100%"
                                    height="160"
                                    scrolling="no"
                                    frameBorder="no"
                                    allow="autoplay"
                                    src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${track.soundcloudId}&color=%23a855f7&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                                ></iframe>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Playlists */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-6 text-secondary">
                        <Headphones size={24} />
                        <h3 className="text-2xl font-display font-bold">Curated Playlists</h3>
                    </div>
                    <div className="grid gap-4">
                        {playlists.map((playlist, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-xl overflow-hidden glass-card hover:border-secondary/50 transition-colors"
                            >
                                <iframe
                                    style={{ borderRadius: '12px' }}
                                    src={`https://open.spotify.com/embed/playlist/${playlist.spotifyId}?utm_source=generator&theme=0`}
                                    width="100%"
                                    height="152"
                                    frameBorder="0"
                                    allowFullScreen=""
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                ></iframe>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MusicSection;
