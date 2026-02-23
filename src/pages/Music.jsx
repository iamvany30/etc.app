/* @source src/pages/Music.jsx */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiClient } from '../api/client';
import { useMusicStore } from '../store/musicStore';
import { useUploadStore } from '../store/uploadStore';
import { TrackSkeleton } from '../components/Skeletons';

import { 
    Magnifer, 
    UploadSquare, 
    MusicNotes, 
    PlayCircle, 
    PauseCircle,
    Ghost,
    VinylRecord
} from "@solar-icons/react";
import '../styles/MusicLibrary.css';


const PlayingEqualizer = () => (
    <div className="track-equalizer">
        <span className="eq-bar"></span>
        <span className="eq-bar"></span>
        <span className="eq-bar"></span>
        <span className="eq-bar"></span>
    </div>
);

const TrackRow = React.memo(({ track, listContext, isCurrent, isPlaying, onPlay }) => {
    return (
        <div className={`track-row ${isCurrent ? 'active' : ''}`} onClick={() => onPlay(track, listContext)}>
            <div className="track-cover-small">
                {track.cover ? (
                    <img src={track.cover} alt="art" loading="lazy" />
                ) : (
                    <div className="track-placeholder">
                        <MusicNotes size={24} />
                    </div>
                )}
                <div className="track-play-overlay">
                    {isCurrent && isPlaying ? <PauseCircle size={28} variant="Bold" /> : <PlayCircle size={28} variant="Bold" />}
                </div>
            </div>
            
            <div className="track-meta-col">
                <div className="track-title-wrapper">
                    <span className={`track-title ${isCurrent ? 'accent' : ''}`}>{track.title}</span>
                    {isCurrent && isPlaying && <PlayingEqualizer />}
                </div>
                <span className="track-artist">{track.artist}</span>
            </div>
            
            <div className="track-album-col">
                <span className="album-badge">{track.album}</span>
            </div>
        </div>
    );
});

const Music = () => {
    const [allTracks, setAllTracks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const currentTrack = useMusicStore(state => state.currentTrack);
    const isPlaying = useMusicStore(state => state.isPlaying);
    const playTrack = useMusicStore(state => state.playTrack);
    const togglePlay = useMusicStore(state => state.togglePlay);
    
    const startMusicUpload = useUploadStore(state => state.startMusicUpload);
    const uploads = useUploadStore(state => state.uploads);

    const fileInputRef = useRef(null);
    const lastUploadCount = useRef(0);

    const decodeMeta = (str) => {
        if (!str) return "";
        try { return decodeURIComponent(escape(window.atob(str))); } catch (e) { return str; }
    };

    const fetchMusic = useCallback(async () => {
        setLoading(true);
        try {
            const [feedRes, tagRes] = await Promise.all([
                apiClient.getPosts('popular', null, 100),
                apiClient.getHashtagPosts('nowkie_music_track', null, 50)
            ]);

            const feedPosts = feedRes?.data?.posts || feedRes?.posts || [];
            const tagPosts = tagRes?.data?.posts || tagRes?.posts || [];
            const combinedPosts = [...feedPosts, ...tagPosts];
            const uniquePosts = Array.from(new Map(combinedPosts.map(p => [p.id, p])).values());

            const parsedTracks = [];
            uniquePosts.forEach(post => {
                const audioAttachment = post.attachments?.find(a => {
                     const type = (a.mimeType || a.type || '').toLowerCase();
                     const name = (a.fileName || a.name || '').toLowerCase();
                     const url = (a.url || '').toLowerCase();
                     return type.startsWith('audio/') || name.match(/\.(mp3|wav|m4a|aac|ogg|flac)$/) || url.match(/\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/);
                });

                if (!audioAttachment) return;

                const coverAttachment = post.attachments?.find(a => {
                    const type = (a.mimeType || a.type || '').toLowerCase();
                    const url = (a.url || '').toLowerCase();
                    return type.startsWith('image/') || url.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                });

                let title = "Без названия";
                let artist = post.author?.displayName || "Неизвестный";
                let album = "Синглы";
                const content = post.content || "";
                
                const titleMatch = content.match(/\[title:(.+?)\]/);
                const artistMatch = content.match(/\[artist:(.+?)\]/);
                const albumMatch = content.match(/\[album:(.+?)\]/);

                if (titleMatch) {
                    title = decodeMeta(titleMatch[1]);
                    if (artistMatch) artist = decodeMeta(artistMatch[1]);
                    if (albumMatch) album = decodeMeta(albumMatch[1]);
                } else {
                    let fileName = audioAttachment.fileName || audioAttachment.name || "";
                    if (fileName) {
                        fileName = fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
                        if (fileName.includes("-")) {
                            const parts = fileName.split("-");
                            if (parts.length >= 2) {
                                artist = parts[0].trim();
                                title = parts.slice(1).join("-").trim();
                            } else {
                                title = fileName;
                            }
                        } else {
                            title = fileName;
                        }
                    }
                }

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
            });
            
            const uniqueTracks = [];
            const seenUrls = new Set();
            parsedTracks.forEach(t => {
                if (!seenUrls.has(t.src)) {
                    seenUrls.add(t.src);
                    uniqueTracks.push(t);
                }
            });

            uniqueTracks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllTracks(uniqueTracks);

        } catch (e) {
            console.error("Critical music fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMusic(); }, [fetchMusic]);

    useEffect(() => {
        const currentUploads = Object.values(uploads).filter(u => u.status === 'complete').length;
        if (currentUploads > lastUploadCount.current) {
            setTimeout(fetchMusic, 1500); 
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
            const alb = track.album || "Синглы";
            if (!grouped[alb]) grouped[alb] = [];
            grouped[alb].push(track);
        });
        return { type: 'albums', data: grouped };
    }, [allTracks, searchQuery]);

    return (
        <div className="music-page-container">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".mp3,.wav,.m4a" style={{display: 'none'}} />
            
            <header className="music-sticky-header">
                <div className="music-header-top">
                    <h2 className="music-header-title">Музыка</h2>
                    <button className="upload-music-btn" onClick={() => fileInputRef.current.click()}>
                        <UploadSquare size={20} />
                        <span>Загрузить трек</span>
                    </button>
                </div>
                <div className="music-search-area">
                    <div className="music-search-wrapper">
                        <div className="music-search-icon"><Magnifer size={18} /></div>
                        <input 
                            type="text" 
                            className="music-search-input" 
                            placeholder="Найти трек или исполнителя..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>
                </div>
            </header>

            <div className="music-content-scroll content-fade-in">
                {loading ? (
                    <div className="flat-track-list">
                        {[...Array(8)].map((_, i) => <TrackSkeleton key={i} />)}
                    </div>
                ) : (
                    <>
                        {content.type === 'list' && (
                            <div className="flat-track-list">
                                {content.data.length === 0 ? (
                                    <div className="music-empty-state">
                                        <div className="music-empty-icon"><Ghost size={48} /></div>
                                        <h3>Ничего не найдено</h3>
                                        <p>По вашему запросу не найдено ни одного трека.</p>
                                    </div>
                                ) : (
                                    content.data.map(track => (
                                        <TrackRow key={track.id} track={track} listContext={content.data} isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying} onPlay={handlePlay} />
                                    ))
                                )}
                            </div>
                        )}
                        {content.type === 'albums' && (
                            Object.keys(content.data).length === 0 ? (
                                <div className="music-empty-state">
                                    <div className="music-empty-icon"><VinylRecord size={48} /></div>
                                    <h3>Библиотека пуста</h3>
                                    <p>В ленте пока нет аудиофайлов. Станьте первым, кто загрузит музыку!</p>
                                    <button className="upload-music-btn-large" onClick={() => fileInputRef.current.click()}>
                                        <UploadSquare size={20} /> Загрузить первый трек
                                    </button>
                                </div>
                            ) : (
                                Object.entries(content.data).map(([albumName, tracks]) => (
                                    <div key={albumName} className="album-group">
                                        <h3 className="album-group-title">{albumName}</h3>
                                        <div className="flat-track-list">
                                            {tracks.map(track => (
                                                <TrackRow key={track.id} track={track} listContext={allTracks} isCurrent={currentTrack?.id === track.id} isPlaying={isPlaying} onPlay={handlePlay} />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </>
                )}
                <div style={{ height: '140px' }} />
            </div>
        </div>
    );
};

export default Music;