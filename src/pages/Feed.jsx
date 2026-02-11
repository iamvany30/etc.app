import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { PostSkeleton } from '../components/Skeletons';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [tab, setTab] = useState('popular'); 
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const nextCursorRef = useRef(null);
    const observer = useRef();

    const loadPosts = useCallback(async (isInitial = false) => {
        if (!isInitial && (loadingMore || !hasMore)) return;
        
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        
        setError(null);

        // Берем курсор из рефа
        const cursor = isInitial ? null : nextCursorRef.current;
        
        try {
            const res = await apiClient.getPosts(tab, cursor, 20);
            
            const newPosts = res?.data?.posts || res?.posts || [];
            const pagination = res?.data?.pagination || res?.pagination;

            if (isInitial) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            if (pagination) {
                nextCursorRef.current = pagination.nextCursor;
                setHasMore(pagination.hasMore);
            } else {
                setHasMore(false);
            }

        } catch (err) {
            console.error("Ошибка загрузки ленты:", err);
            setError("Не удалось загрузить посты. Проверьте соединение.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [tab]); 

    
    useEffect(() => {
        nextCursorRef.current = null;
        setHasMore(true);
        setPosts([]);
        loadPosts(true);
    }, [tab, loadPosts]);

    const lastPostRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadPosts(false);
            }
        });
        
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, loadPosts]);

    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
    };

    return (
        <div className="feed-page">
            <header className="feed-tabs">
                <button
                    className={`feed-tab ${tab === 'popular' ? 'active' : ''}`}
                    onClick={() => setTab('popular')}
                >
                    <span className="tab-content">Популярное</span>
                </button>
                <button
                    className={`feed-tab ${tab === 'subscribed' ? 'active' : ''}`}
                    onClick={() => setTab('subscribed')}
                >
                    <span className="tab-content">Подписки</span>
                </button>
            </header>

            <CreatePost onPostCreated={handlePostCreated} />

            {loading && posts.length === 0 ? (
                <div className="skeleton-list">
                    {[1, 2, 3, 4].map(i => <PostSkeleton key={i} />)}
                </div>
            ) : (
                <div className="post-list">
                    {posts.map((post, index) => {
                        const isLast = posts.length === index + 1;
                        return (
                            <div ref={isLast ? lastPostRef : null} key={`${post.id}-${index}`}>
                                <PostCard post={post} />
                            </div>
                        );
                    })}
                </div>
            )}

            {loadingMore && <div style={{padding: 20}}><PostSkeleton /></div>}

            {error && !loading && (
                <div className="feed-error">
                    <p>{error}</p>
                    <button className="retry-btn" onClick={() => loadPosts(true)}>Повторить</button>
                </div>
            )}

            {!loading && !loadingMore && !hasMore && posts.length > 0 && (
                <div className="feed-end-message">
                    <span>✨</span> Вы просмотрели всё на сегодня
                </div>
            )}

            {!loading && posts.length === 0 && !error && (
                <div className="empty-state">
                    <h3>Здесь пока ничего нет</h3>
                    {tab === 'subscribed' ? (
                        <p>
                            Подпишитесь на интересных авторов в разделе <Link to="/explore" className="empty-feed-link">Обзор</Link>, чтобы видеть их посты здесь.
                        </p>
                    ) : (
                        <p>Попробуйте обновить страницу позже.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Feed;