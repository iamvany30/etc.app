import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../api/client';
import { useMusic } from '../context/MusicContext';
import { PlayIcon, PauseIcon } from '../components/icons/MediaIcons';
import { TrackSkeleton } from '../components/Skeletons';
import '../styles/MusicLibrary.css';


const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-text-secondary)'}}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const Music = () => {
    const [allTracks, setAllTracks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const { currentTrack, isPlaying, playTrack } = useMusic();

        const decodeMeta = (str) => {
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            return "Неизвестно";
        }
    };

        const fetchMusic = useCallback(async () => {
        setLoading(true);
        try {
            
            const listRes = await apiClient.getHashtagPosts('#nowkie_music_track', null, 50);
            const postsList = listRes?.data?.posts || listRes?.posts || [];

            if (postsList.length === 0) {
                setAllTracks([]);
                setLoading(false);
                return;
            }

            
            const detailPromises = postsList.map(post => apiClient.getPostDetails(post.id));
            const detailResults = await Promise.all(detailPromises);
            
            const fullPosts = detailResults
                .map(res => res?.data || res)
                .filter(post => post && post.id && post.content);

            const parsedTracks = [];

            fullPosts.forEach(post => {
                try {
                    
                    const artistMatch = post.content.match(/\[artist:(.+?)\]/);
                    const titleMatch = post.content.match(/\[title:(.+?)\]/);
                    const albumMatch = post.content.match(/\[album:(.+?)\]/);

                    if (!artistMatch || !titleMatch) return;

                    const artist = decodeMeta(artistMatch[1]);
                    const title = decodeMeta(titleMatch[1]);
                    const album = albumMatch ? decodeMeta(albumMatch[1]) : "Синглы";

                    
                    const audioAttachment = post.attachments?.find(a => {
                         const type = a.mimeType || a.type || '';
                         const url = a.url || '';
                         return type.startsWith('audio/') || 
                                type === 'video/mpeg' || 
                                url.toLowerCase().endsWith('.mp3') ||
                                (!type.startsWith('image/') && !type.startsWith('video/'));
                    });

                    
                    const coverAttachment = post.attachments?.find(a => {
                        const type = a.mimeType || a.type || '';
                        const url = a.url || '';
                        return type.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(url);
                    });

                    if (audioAttachment) {
                        parsedTracks.push({ 
                            id: post.id, 
                            artist, 
                            title, 
                            album,
                            src: audioAttachment.url,
                            cover: coverAttachment ? coverAttachment.url : null,
                            createdAt: post.createdAt,
                            
                            searchStr: `${title} ${artist}`.toLowerCase()
                        });
                    }
                } catch (e) {
                    console.error("Parse error for post:", post.id, e);
                }
            });
            
            
            parsedTracks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllTracks(parsedTracks);

        } catch (e) {
            console.error("Critical music load error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMusic(); }, [fetchMusic]);

        const content = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        
        
        if (query) {
            const filtered = allTracks.filter(t => t.searchStr.includes(query));
            return { type: 'list', data: filtered };
        }

        
        const grouped = {};
        allTracks.forEach(track => {
            if (!grouped[track.album]) grouped[track.album] = [];
            grouped[track.album].push(track);
        });
        return { type: 'albums', data: grouped };

    }, [allTracks, searchQuery]);

        const TrackRow = ({ track, listContext }) => {
        const isCurrent = currentTrack?.id === track.id;
        
        return (
            <div 
                className={`track-row ${isCurrent ? 'active' : ''}`}
                onClick={() => playTrack(track, listContext)}
            >
                <div className="track-cover-small">
                    {track.cover ? (
                        <img src={track.cover} alt="art" loading="lazy" />
                    ) : (
                        <div className="track-placeholder">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                        </div>
                    )}
                    <div className="track-play-overlay">
                        {isCurrent && isPlaying ? <PauseIcon width="20" height="20" /> : <PlayIcon width="20" height="20" />}
                    </div>
                </div>
                
                <div className="track-meta-col">
                    <span className={`track-title ${isCurrent ? 'accent' : ''}`}>{track.title}</span>
                    <span className="track-artist">{track.artist}</span>
                </div>
                
                <div className="track-album-col">
                    {track.album}
                </div>
            </div>
        );
    };

    return (
        <div className="music-page-container">
            
            <div className="music-header-sticky">
                <h2 className="music-page-title">Музыка</h2>
                <div className="music-search-wrapper">
                    <div className="music-search-icon">
                        <SearchIcon />
                    </div>
                    <input 
                        type="text" 
                        className="music-search-input"
                        placeholder="Трек или исполнитель..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="music-content-scroll">
                {loading ? (
                    <div className="flat-track-list">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <TrackSkeleton key={i} />)}
                    </div>
                ) : (
                    <>
                        
                        {content.type === 'list' && (
                            <div className="flat-track-list">
                                {content.data.length === 0 ? (
                                    <div className="empty-state">Ничего не найдено</div>
                                ) : (
                                    content.data.map(track => (
                                        <TrackRow 
                                            key={track.id} 
                                            track={track} 
                                            listContext={content.data} 
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        
                        {content.type === 'albums' && (
                            Object.keys(content.data).length === 0 ? (
                                <div className="empty-state">
                                    <h3>Библиотека пуста</h3>
                                    <p style={{marginTop: '8px', opacity: 0.7}}>Загрузите свой первый MP3 через создание поста!</p>
                                </div>
                            ) : (
                                Object.keys(content.data).map(albumName => (
                                    <div key={albumName} className="album-group">
                                        <h3 className="album-group-title">{albumName}</h3>
                                        <div className="flat-track-list">
                                            {content.data[albumName].map(track => (
                                                <TrackRow 
                                                    key={track.id} 
                                                    track={track} 
                                                    listContext={allTracks} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </>
                )}
                
                <div style={{ height: '100px' }} />
            </div>
        </div>
    );
};

export default Music;