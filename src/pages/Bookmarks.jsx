/* @source src/pages/Bookmarks.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { bookmarkUtils } from '../utils/bookmarkUtils';
import PostCard from '../components/PostCard';
import { useModalStore } from '../store/modalStore';
import BookmarkFolderModal from '../components/modals/BookmarkFolderModal';
import { AltArrowLeft, BookmarkSquare, Magnifer, CloseCircle, Folder } from "@solar-icons/react";
import Fuse from 'fuse.js'; 
import '../styles/Downloads.css'; 

const Bookmarks = () => {
    const navigate = useNavigate();
    const openModal = useModalStore(state => state.openModal);
    
    const [posts, setPosts] = useState([]);
    const [folders, setFolders] = useState([]);
    const [activeFolderId, setActiveFolderId] = useState('default');
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = () => {
        setFolders(bookmarkUtils.getFolders());
        setPosts(bookmarkUtils.getAll(activeFolderId));
    };

    useEffect(() => {
        loadData();
        window.addEventListener('bookmarks-updated', loadData);
        return () => window.removeEventListener('bookmarks-updated', loadData);
    }, [activeFolderId]);

    const fuse = useMemo(() => new Fuse(posts, {
        keys: ['content', 'author.displayName', 'author.username'],
        threshold: 0.3,
        ignoreLocation: true
    }), [posts]);

    const displayPosts = useMemo(() => {
        if (!searchQuery.trim()) return posts;
        return fuse.search(searchQuery).map(result => result.item);
    }, [searchQuery, posts, fuse]);

    
    const renderPostWithFolderControl = (index, post) => (
        <div key={post.id} style={{ position: 'relative' }}>
            <PostCard post={post} />
            <button 
                onClick={() => openModal(<BookmarkFolderModal postId={post.id} currentFolderId={post.folderId || 'default'} />)}
                style={{
                    position: 'absolute', top: '16px', right: '48px', zIndex: 20,
                    background: 'var(--color-input-bg)', border: '1px solid var(--color-border)',
                    borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold',
                    color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                }}
            >
                <Folder size={12} /> В папку
            </button>
        </div>
    );

    return (
        <div className="downloads-page">
            <header className="dl-sticky-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="dl-back-btn" onClick={() => navigate(-1)} style={{ flexShrink: 0 }}>
                        <AltArrowLeft size={24} />
                    </button>
                    
                    <div className="dl-search-wrapper" style={{ maxWidth: '100%' }}>
                        <Magnifer size={18} className="dl-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Поиск по закладкам..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="dl-search-clear" onClick={() => setSearchQuery('')}>
                                <CloseCircle size={18} variant="Bold" />
                            </button>
                        )}
                    </div>
                </div>

                {}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="custom-scrollbar-hide">
                    {folders.map(f => (
                        <button 
                            key={f.id}
                            onClick={() => setActiveFolderId(f.id)}
                            style={{
                                padding: '6px 12px', borderRadius: '99px', whiteSpace: 'nowrap',
                                border: '1px solid', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                                background: activeFolderId === f.id ? f.color || 'var(--color-primary)' : 'transparent',
                                borderColor: activeFolderId === f.id ? 'transparent' : 'var(--color-border)',
                                color: activeFolderId === f.id ? '#fff' : 'var(--color-text-secondary)'
                            }}
                        >
                            {f.name}
                        </button>
                    ))}
                </div>
            </header>

            <div className="downloads-content content-fade-in" style={{ padding: 0 }}>
                {posts.length === 0 ? (
                    <div className="dl-empty-state">
                        <div className="dl-empty-icon" style={{ color: '#ffad1f', borderColor: 'rgba(255,173,31,0.2)', background: 'linear-gradient(135deg, rgba(255,173,31,0.15), transparent)'}}>
                            <BookmarkSquare size={48} variant="Bold" />
                        </div>
                        <h3>Папка пуста</h3>
                        <p>Добавляйте посты в закладки и распределяйте их по категориям для удобства.</p>
                    </div>
                ) : displayPosts.length === 0 ? (
                    <div className="dl-empty-state">
                        <Magnifer size={48} color="var(--color-text-secondary)" style={{marginBottom: 16, opacity: 0.5}} />
                        <h3>Ничего не найдено</h3>
                        <p>По вашему запросу «{searchQuery}» нет сохраненных постов.</p>
                    </div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={displayPosts} 
                        data-virtuoso-scroller="true"
                        itemContent={renderPostWithFolderControl}
                        components={{ Footer: () => <div style={{ height: '140px' }} /> }}
                    />
                )}
            </div>
        </div>
    );
};

export default Bookmarks;