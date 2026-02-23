/* @source src/pages/Bookmarks.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { bookmarkUtils } from '../utils/bookmarkUtils';
import PostCard from '../components/PostCard';
import { AltArrowLeft, BookmarkSquare } from "@solar-icons/react";
import '../styles/Downloads.css'; 

const Bookmarks = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);

    const loadBookmarks = () => {
        setPosts(bookmarkUtils.getAll());
    };

    useEffect(() => {
        loadBookmarks();
        window.addEventListener('bookmarks-updated', loadBookmarks);
        return () => window.removeEventListener('bookmarks-updated', loadBookmarks);
    }, []);

    return (
        <div className="downloads-page">
            <header className="dl-sticky-header">
                <div className="dl-header-left">
                    <button className="dl-back-btn" onClick={() => navigate(-1)}>
                        <AltArrowLeft size={24} />
                    </button>
                    <h2 className="dl-header-title">Закладки</h2>
                </div>
            </header>

            <div className="downloads-content content-fade-in" style={{ padding: 0 }}>
                {posts.length === 0 ? (
                    <div className="dl-empty-state">
                        <div className="dl-empty-icon" style={{ color: '#ffad1f', borderColor: 'rgba(255,173,31,0.2)', background: 'linear-gradient(135deg, rgba(255,173,31,0.15), transparent)'}}>
                            <BookmarkSquare size={48} variant="Bold" />
                        </div>
                        <h3>Сохраняйте лучшее</h3>
                        <p>Здесь будут храниться посты, которые вы добавили в закладки. Они доступны локально только на этом устройстве.</p>
                    </div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={posts}
                        data-virtuoso-scroller="true"
                        itemContent={(index, post) => (
                            <PostCard post={post} key={post.id} />
                        )}
                        components={{ Footer: () => <div style={{ height: '140px' }} /> }}
                    />
                )}
            </div>
        </div>
    );
};

export default Bookmarks;