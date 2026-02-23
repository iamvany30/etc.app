/* @source src/pages/Feed.jsx */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { usePosts } from '../hooks/usePosts'; 
import { useQueryClient } from '@tanstack/react-query'; 

import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { PostSkeleton } from '../components/Skeletons';

import { Ghost, Planet, RefreshCircle, MagicStick3 } from "@solar-icons/react";
import '../styles/Feed.css';

const Feed = () => {
    const [tab, setTab] = useState('popular');
    const virtuosoRef = useRef(null);
    const queryClient = useQueryClient();

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = usePosts(tab);

    
    
    const allPosts = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap(page => {
            if (!page) return [];
            
            const postsArray = page.posts || (Array.isArray(page) ? page : (page.data && Array.isArray(page.data) ? page.data : []));
            return postsArray;
        }).filter(Boolean); 
    }, [data]);

    const handlePostCreated = useCallback((newPost) => {
        queryClient.setQueryData(['posts', tab], (oldData) => {
            if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
            const newPages = [...oldData.pages];
            
            
            if (Array.isArray(newPages[0])) {
                newPages[0] = [newPost, ...newPages[0]];
            } else if (newPages[0]) {
                newPages[0] = {
                    ...newPages[0],
                    posts: [newPost, ...(newPages[0].posts || [])]
                };
            }
            
            return { ...oldData, pages: newPages };
        });
        
        virtuosoRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
    }, [queryClient, tab]);

    const Header = useMemo(() => () => (
        <>
            <header className="feed-header">
                <div className="feed-tabs-container">
                    <button
                        className={`feed-tab ${tab === 'popular' ? 'active' : ''}`}
                        onClick={() => setTab('popular')}
                    >
                        Популярное
                    </button>
                    <button
                        className={`feed-tab ${tab === 'subscribed' ? 'active' : ''}`}
                        onClick={() => setTab('subscribed')}
                    >
                        Подписки
                    </button>
                </div>
            </header>
            
            <div className="feed-create-post-wrapper">
                <CreatePost onPostCreated={handlePostCreated} />
            </div>
            
            {isLoading && (
                <div className="skeleton-list">
                    {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                </div>
            )}

            {!isLoading && !isError && allPosts.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        {tab === 'subscribed' ? <Ghost size={48} /> : <Planet size={48} />}
                    </div>
                    <h3>{tab === 'subscribed' ? 'Ваша лента пуста' : 'Ничего не найдено'}</h3>
                    <p>
                        {tab === 'subscribed' 
                            ? <>Посты от тех, на кого вы подписаны, появятся здесь. <Link to="/explore" className="empty-feed-link">Найти друзей</Link>.</>
                            : 'В этой ленте пока нет постов. Станьте первым, кто напишет!'}
                    </p>
                </div>
            )}

            {isError && (
                <div className="feed-error-state">
                    <div className="error-icon"><RefreshCircle size={40} /></div>
                    <h3>Ошибка загрузки</h3>
                    <p>{error?.message || 'Не удалось связаться с сервером.'}</p>
                    <button className="retry-btn" onClick={() => fetchNextPage()}>Повторить попытку</button>
                </div>
            )}
        </>
    ), [tab, isLoading, isError, allPosts.length, error, fetchNextPage, handlePostCreated]);

    const Footer = useMemo(() => () => {
        if (isFetchingNextPage) return <div style={{padding: '20px 0'}}><PostSkeleton /></div>;
        
        if (!hasNextPage && allPosts.length > 0) {
            return (
                <div className="feed-end-message">
                    <MagicStick3 size={20} />
                    <span>Вы просмотрели всё</span>
                </div>
            );
        }
        return <div style={{ height: '90px' }} />;
    }, [isFetchingNextPage, hasNextPage, allPosts.length]);

    return (
        <div className="feed-page">
            <Virtuoso
                ref={virtuosoRef}
                style={{ height: '100%' }}
                data={allPosts}
                endReached={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }}
                overscan={1500} 
                data-virtuoso-scroller="true" 
                
                itemContent={(index, post) => {
                    if (!post) return null;
                    return <PostCard post={post} key={post.id || index} />;
                }}
                components={{ Header, Footer }}
            />
        </div>
    );
};

export default Feed;