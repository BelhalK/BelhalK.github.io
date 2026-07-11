import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { playlists, production } from '../data/music';
import { Disc, Headphones, ExternalLink } from 'lucide-react';
import SectionHeader from './SectionHeader';

const MusicSection = () => {
    const reduce = useReducedMotion();
    return (
        <section className="space-y-14">
            <SectionHeader
                title="Music"
                eyebrow="Sonic Explorations"
                subtitle="Curated playlists and original productions, a creative counterpoint to the research."
                subtitleClassName="md:max-w-none"
            />

            <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
                {/* Produced */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2.5 text-primary">
                        <Disc size={22} />
                        <h3 className="text-xl md:text-2xl font-display font-semibold">Original Production</h3>
                    </div>
                    <div className="space-y-4">
                        {production.map((track, i) => (
                            <motion.div
                                key={i}
                                initial={reduce ? { opacity: 1 } : { opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(i * 0.08, 0.3), duration: 0.45 }}
                                className="rounded-2xl overflow-hidden glass-card"
                            >
                                <iframe
                                    title={`SoundCloud player — ${track.title} by ${track.artist}`}
                                    width="100%"
                                    height="166"
                                    scrolling="no"
                                    frameBorder="no"
                                    allow="autoplay"
                                    src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${track.soundcloudId}&color=%23c2570f&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                                />
                                {track.link && (
                                    <a
                                        href={track.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors border-t border-border/70"
                                    >
                                        <ExternalLink size={12} /> Open on SoundCloud
                                    </a>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Playlists */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2.5 text-secondary">
                        <Headphones size={22} />
                        <h3 className="text-xl md:text-2xl font-display font-semibold">Curated Playlists</h3>
                    </div>
                    <div className="grid gap-4">
                        {playlists.map((playlist, i) => (
                            <motion.div
                                key={i}
                                initial={reduce ? { opacity: 1 } : { opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(i * 0.08, 0.3), duration: 0.45 }}
                                className="rounded-2xl overflow-hidden glass-card"
                            >
                                <iframe
                                    title={`Spotify player — ${playlist.title} playlist`}
                                    style={{ borderRadius: '12px' }}
                                    src={`https://open.spotify.com/embed/playlist/${playlist.spotifyId}?utm_source=generator&theme=0`}
                                    width="100%"
                                    height="152"
                                    frameBorder="0"
                                    allowFullScreen=""
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MusicSection;
