import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { usePosts } from '../hooks/usePosts'; 
import { useQueryClient } from '@tanstack/react-query'; 

import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { PostSkeleton } from '../components/Skeletons';

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
        return data?.pages.flatMap(page => page.posts) || [];
    }, [data]);

    
    const handlePostCreated = useCallback((newPost) => {
        queryClient.setQueryData(['posts', tab], (oldData) => {
            if (!oldData) return oldData;
            
            
            const newPages = [...oldData.pages];
            
            newPages[0] = {
                ...newPages[0],
                posts: [newPost, ...newPages[0].posts]
            };

            return {
                ...oldData,
                pages: newPages,
            };
        });
        
        
        virtuosoRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
    }, [queryClient, tab]);

    
    const Header = useMemo(() => () => (
        <>
            <header className="sticky-header">
                <div className="sticky-tabs">
                    <button
                        className={`sticky-tab-btn ${tab === 'popular' ? 'active' : ''}`}
                        onClick={() => setTab('popular')}
                    >
                        Популярное
                    </button>
                    <button
                        className={`sticky-tab-btn ${tab === 'subscribed' ? 'active' : ''}`}
                        onClick={() => setTab('subscribed')}
                    >
                        Подписки
                    </button>
                </div>
            </header>
            
            <CreatePost onPostCreated={handlePostCreated} />
            
            {}
            {isLoading && (
                <div className="skeleton-list">
                    {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                </div>
            )}

            {}
            {!isLoading && !isError && allPosts.length === 0 && (
                <div className="empty-state">
                    <h3>{tab === 'subscribed' ? 'Ваша лента пуста' : 'Ничего не найдено'}</h3>
                    <p>
                        {tab === 'subscribed' 
                            ? <>Посты от подписок появятся здесь. <Link to="/explore" className="empty-feed-link">Найти друзей</Link>.</>
                            : 'В этой ленте пока нет постов.'}
                    </p>
                </div>
            )}

            {}
            {isError && (
                <div className="feed-error">
                    <h3>Ошибка загрузки</h3>
                    <p>{error?.message}</p>
                    <button className="retry-btn" onClick={() => fetchNextPage()}>Повторить</button>
                </div>
            )}
        </>
    ), [tab, isLoading, isError, allPosts.length, error, fetchNextPage, handlePostCreated]);

    
    const Footer = useMemo(() => () => {
        if (isFetchingNextPage) return <div style={{padding: '20px 0'}}><PostSkeleton /></div>;
        
        if (!hasNextPage && allPosts.length > 0) {
            return (
                <div className="feed-end-message">
                    <span>✨</span>
                    <p>Вы всё просмотрели</p>
                </div>
            );
        }
        return <div style={{ height: '90px' }} />;
    }, [isFetchingNextPage, hasNextPage, allPosts.length]);

    return (
        <div className="feed-page" style={{ height: '100%' }}>
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
                itemContent={(index, post) => (
                    <PostCard post={post} key={post.id} />
                )}
                components={{ Header, Footer }}
            />
        </div>
    );
};

export default Feed;