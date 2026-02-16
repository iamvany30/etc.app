/* @source Music.jsx */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiClient } from '../api/client';
import { useMusic } from '../context/MusicContext';
import { useUpload } from '../context/UploadContext';
import { PlayIcon, PauseIcon } from '../components/icons/MediaIcons';
import { TrackSkeleton } from '../components/Skeletons';
import '../styles/MusicLibrary.css';


const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-text-secondary)'}}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const UploadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const MusicPlaceholderIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
);

const TrackRow = React.memo(({ track, listContext, isCurrent, isPlaying, onPlay }) => {
    return (
        <div 
            className={`track-row ${isCurrent ? 'active' : ''}`}
            onClick={() => onPlay(track, listContext)}
        >
            <div className="track-cover-small">
                {track.cover ? (
                    <img src={track.cover} alt="art" loading="lazy" />
                ) : (
                    <div className="track-placeholder">
                        <MusicPlaceholderIcon />
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
});

const Music = () => {
    const [allTracks, setAllTracks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const { currentTrack, isPlaying, playTrack, togglePlay } = useMusic();
    const { startMusicUpload, uploads } = useUpload();
    const fileInputRef = useRef(null);
    const lastUploadCount = useRef(0);

    const decodeMeta = (str) => {
        try {
            return decodeURIComponent(escape(window.atob(str)));
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
            
            const parsedTracks = [];

            postsList.forEach(post => {
                try {
                    const artistMatch = post.content.match(/\[artist:(.+?)\]/);
                    const titleMatch = post.content.match(/\[title:(.+?)\]/);
                    const albumMatch = post.content.match(/\[album:(.+?)\]/);

                    if (!artistMatch || !titleMatch) return;

                    const artist = decodeMeta(artistMatch[1]);
                    const title = decodeMeta(titleMatch[1]);
                    const album = albumMatch ? decodeMeta(albumMatch[1]) : "Синглы";

                    
                    const audioAttachment = post.attachments?.find(a => {
                         const type = (a.mimeType || a.type || '').toLowerCase();
                         const url = (a.url || '').toLowerCase();
                         return type.startsWith('audio/') || url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.m4a');
                    });
                    
                    const coverAttachment = post.attachments?.find(a => {
                        const type = (a.mimeType || a.type || '').toLowerCase();
                        const url = (a.url || '').toLowerCase();
                        return type.startsWith('image/') || 
                               url.match(/\.(jpg|jpeg|png|webp|gif)$/i);
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
                    console.error("Ошибка парсинга трека:", post.id, e);
                }
            });
            
            parsedTracks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllTracks(parsedTracks);

        } catch (e) {
            console.error("Ошибка загрузки музыки:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMusic(); }, [fetchMusic]);

    
    useEffect(() => {
        const currentUploads = Object.values(uploads).filter(u => u.status === 'complete').length;
        if (currentUploads > lastUploadCount.current) {
            setTimeout(fetchMusic, 1000); 
        }
        lastUploadCount.current = currentUploads;
    }, [uploads, fetchMusic]);

    const handlePlay = useCallback((track, playlist) => {
        if (currentTrack?.id === track.id) {
            togglePlay();
        } else {
            playTrack(track, playlist);
        }
    }, [currentTrack, togglePlay, playTrack]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            startMusicUpload(file);
        }
        e.target.value = null; 
    };

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

    return (
        <div className="music-page-container">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".mp3" style={{display: 'none'}} />
            <div className="sticky-header">
                <div className="music-header-top">
                    <h2 className="sticky-header-title">Музыка</h2>
                    <button className="upload-music-btn" onClick={() => fileInputRef.current.click()}>
                        <UploadIcon />
                        <span>Загрузить трек</span>
                    </button>
                </div>
                <div style={{padding: '0 16px 12px'}}>
                    <div className="music-search-wrapper">
                        <div className="music-search-icon"><SearchIcon /></div>
                        <input 
                            type="text" 
                            className="music-search-input"
                            placeholder="Найти трек или исполнителя..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="music-content-scroll">
                {loading ? (
                    <div className="flat-track-list">
                        {[...Array(8)].map((_, i) => <TrackSkeleton key={i} />)}
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
                                            isCurrent={currentTrack?.id === track.id}
                                            isPlaying={isPlaying}
                                            onPlay={handlePlay}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {content.type === 'albums' && (
                            Object.keys(content.data).length === 0 ? (
                                <div className="empty-state">
                                    <h3>Библиотека пуста</h3>
                                    <p>Загрузите первый MP3 через создание поста!</p>
                                </div>
                            ) : (
                                Object.entries(content.data).map(([albumName, tracks]) => (
                                    <div key={albumName} className="album-group">
                                        <h3 className="album-group-title">{albumName}</h3>
                                        <div className="flat-track-list">
                                            {tracks.map(track => (
                                                <TrackRow 
                                                    key={track.id} 
                                                    track={track} 
                                                    listContext={allTracks} 
                                                    isCurrent={currentTrack?.id === track.id}
                                                    isPlaying={isPlaying}
                                                    onPlay={handlePlay}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </>
                )}
                <div style={{ height: '120px' }} />
            </div>
        </div>
    );
};

export default Music;