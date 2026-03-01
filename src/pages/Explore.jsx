/* @source src/pages/Explore.jsx */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { apiClient } from '../api/client';
import { storage } from '../utils/storage'; 
import PostCard from '../components/PostCard'; 
import { PostSkeleton, ExploreSkeleton, WidgetSkeleton } from '../components/Skeletons';
import ScrollArea from '../components/ScrollArea';

import { 
    Magnifer, 
    CloseCircle, 
    Hashtag, 
    UsersGroupTwoRounded, 
    Ghost,
    Fire
} from "@solar-icons/react";
import '../styles/Explore.css';

const CACHE_KEY = 'itd_explore_data_v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; 

const Explore = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryFromUrl = searchParams.get('q') || "";

    const [searchQuery, setSearchQuery] = useState(queryFromUrl);
    const [searchType, setSearchType] = useState('all');
    const [searchSort, setSearchSort] = useState('relevance');

    const [trendsData, setTrendsData] = useState({ trending: [], clans: [] });
    const [searchResults, setSearchResults] = useState(null); 
    const [hashtagPosts, setHashtagPosts] = useState([]); 
    
    const [loading, setLoading] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true); 
    const [loadingMore, setLoadingMore] = useState(false);

    const nextCursorRef = useRef(null);
    const hasMoreRef = useRef(false);
    const isFetchingRef = useRef(false);
    const activeSearchRef = useRef(queryFromUrl);

    const isHashtagFeedMode = searchQuery.trim().startsWith('#');

    useEffect(() => {
        const loadInitialData = async () => {
            if (searchQuery) {
                setLoadingInitial(false);
                return;
            }

            try {
                const cachedRaw = await storage.get(CACHE_KEY);
                if (cachedRaw) {
                    const { data, timestamp } = cachedRaw; 
                    const age = Date.now() - timestamp;

                    if (age < CACHE_TTL) {
                        setTrendsData(data);
                        setLoadingInitial(false);
                        return; 
                    }
                }
            } catch (e) {
                storage.remove(CACHE_KEY);
            }

            try {
                const [trendsRes, clansRes] = await Promise.all([
                    apiClient.getExplore(),
                    apiClient.getTopClans()
                ]);

                const newData = {
                    trending: trendsRes?.data?.hashtags || trendsRes?.hashtags || [],
                    clans: clansRes?.data?.clans || clansRes?.clans || [],
                };

                setTrendsData(newData);
                
                storage.set(CACHE_KEY, {
                    data: newData,
                    timestamp: Date.now()
                });

            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoadingInitial(false); 
            }
        };

        loadInitialData();
    }, [searchQuery]);

    const loadHashtagFeed = useCallback(async (isInitial = false) => {
        if (!searchQuery.trim().startsWith('#') || isFetchingRef.current) return;
        if (!isInitial && !hasMoreRef.current) return;

        const tag = searchQuery.replace('#', '').trim();
        if (!tag) return;

        isFetchingRef.current = true;
        if (isInitial) {
            setLoading(true);
            setHashtagPosts([]);
            nextCursorRef.current = null;
        } else {
            setLoadingMore(true);
        }

        try {
            const res = await apiClient.getHashtagPosts(tag, nextCursorRef.current);
            if (activeSearchRef.current !== searchQuery) return;

            const data = res?.data || res;
            const newPosts = data?.posts || [];
            
            setHashtagPosts(prev => isInitial ? newPosts : [...prev, ...newPosts]);
            nextCursorRef.current = data?.pagination?.nextCursor || null;
            hasMoreRef.current = !!data?.pagination?.hasMore;
        } catch (e) { 
            console.error(e); 
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [searchQuery]);

    useEffect(() => {
        const query = searchQuery.trim();
        activeSearchRef.current = query;
        let isCancelled = false; 

        if (!query) {
            setSearchResults(null);
            setHashtagPosts([]);
            setSearchParams({}, { replace: true });
            setLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            if (isCancelled) return;

            setSearchParams({ q: query }, { replace: true });

            if (query.startsWith('#')) {
                if (!isCancelled) loadHashtagFeed(true);
            } else {
                if (!isCancelled) setLoading(true);
                try {
                    const res = await apiClient.advancedSearch({ 
                        q: query, 
                        type: searchType, 
                        sort: searchSort, 
                        limit: 20 
                    });
                    if (!isCancelled) setSearchResults(res?.data || res);
                } catch (e) { 
                    console.error(e); 
                } finally { 
                    if (!isCancelled) setLoading(false); 
                }
            }
        }, 400);

        return () => {
            clearTimeout(timer);
            isCancelled = true; 
        };
    }, [searchQuery, setSearchParams, loadHashtagFeed, searchType, searchSort]);

    const renderBody = () => {
        if (!searchQuery && loadingInitial) {
            return <ExploreSkeleton />;
        }

        if (!searchQuery.trim()) {
            return (
                <ScrollArea className="explore-scroll-area content-fade-in">
                    {trendsData.clans.length > 0 && (
                        <section className="explore-section">
                            <h3 className="explore-section-title">
                                <UsersGroupTwoRounded size={22} className="section-icon" />
                                Топ сообществ
                            </h3>
                            <div className="clans-horizontal-scroll custom-scrollbar-hide">
                                {trendsData.clans.map((clan, idx) => (
                                    <div key={idx} className={`clan-card ${idx < 3 ? 'top-tier' : ''}`}>
                                        <div className="clan-avatar-ring">
                                            <div className="clan-avatar-inner">
                                                {clan.avatar}
                                            </div>
                                            <div className="clan-members-badge">
                                                {clan.memberCount}
                                            </div>
                                        </div>
                                        <span className="clan-name">{clan.name || 'Клан'}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="explore-section">
                        <h3 className="explore-section-title">
                            <Fire size={22} className="section-icon" />
                            Актуальные темы
                        </h3>
                        <div className="trends-list">
                            {trendsData.trending.map((tag, idx) => (
                                <div key={tag.id || idx} className="trend-item" onClick={() => setSearchQuery('#' + tag.name)}>
                                    <div className="trend-number">{idx + 1}</div>
                                    <div className="trend-info">
                                        <span className="trend-name">#{tag.name}</span>
                                        <span className="trend-count">{tag.postsCount} постов</span>
                                    </div>
                                    <div className="trend-arrow">›</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </ScrollArea>
            );
        }

        if (isHashtagFeedMode) {
            if (!loading && hashtagPosts.length === 0) {
                return (
                    <div className="explore-empty-state content-fade-in">
                        <div className="explore-empty-icon"><Hashtag size={48} /></div>
                        <h3>Постов не найдено</h3>
                        <p>По тегу <b>{searchQuery}</b> пока никто ничего не публиковал.</p>
                    </div>
                );
            }

            return (
                <Virtuoso
                    style={{ height: '100%' }}
                    data={hashtagPosts}
                    endReached={() => loadHashtagFeed(false)}
                    itemContent={(index, post) => <PostCard post={post} key={post.id} />}
                    components={{
                        Header: () => loading ? <div className="p-16"><PostSkeleton /><PostSkeleton /></div> : (
                            <div className="hashtag-feed-header">
                                <div className="hashtag-feed-icon"><Hashtag size={28} /></div>
                                <h2>{searchQuery}</h2>
                            </div>
                        ),
                        Footer: () => (
                            <div style={{ paddingBottom: '140px', paddingTop: '20px' }}>
                                {loadingMore && <PostSkeleton />}
                                {!hasMoreRef.current && hashtagPosts.length > 0 && <div className="end-msg">Больше постов нет</div>}
                            </div>
                        )
                    }}
                />
            );
        }

        return (
            <ScrollArea className="explore-scroll-area">
                {loading ? (
                    <div style={{padding: 16}}><WidgetSkeleton /></div>
                ) : (
                    <GlobalResultsList results={searchResults} onTagClick={(t) => setSearchQuery('#' + t)} searchType={searchType} />
                )}
            </ScrollArea>
        );
    };

    return (
        <div className="explore-page">
            <header className="explore-sticky-header">
                <div className="explore-search-container">
                    <div className="search-input-wrapper">
                        <div className="search-icon-left"><Magnifer size={18} /></div>
                        <input 
                            type="text" 
                            className="explore-input"
                            placeholder="Поиск людей или #тегов"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                                <CloseCircle size={20} variant="Bold" />
                            </button>
                        )}
                    </div>
                </div>

                {searchQuery && !isHashtagFeedMode && (
                    <div style={{ padding: '0 16px 12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-input-bg)', padding: '4px', borderRadius: '12px' }}>
                            {['all', 'users', 'posts', 'hashtags'].map(t => (
                                <button 
                                    key={t} 
                                    onClick={() => setSearchType(t)}
                                    style={{
                                        padding: '6px 12px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                        background: searchType === t ? 'var(--color-card)' : 'transparent',
                                        color: searchType === t ? 'var(--color-text)' : 'var(--color-text-secondary)',
                                        boxShadow: searchType === t ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {t === 'all' ? 'Все' : t === 'users' ? 'Люди' : t === 'posts' ? 'Посты' : 'Теги'}
                                </button>
                            ))}
                        </div>
                        <select 
                            value={searchSort} 
                            onChange={(e) => setSearchSort(e.target.value)}
                            style={{
                                padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                                background: 'var(--color-item-bg)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none', marginLeft: 'auto'
                            }}
                        >
                            <option value="relevance">По релевантности</option>
                            <option value="new">Сначала новые</option>
                            <option value="popular">Сначала популярные</option>
                        </select>
                    </div>
                )}
            </header>

            <div className="explore-content-container">
                {renderBody()}
            </div>
        </div>
    );
};

const GlobalResultsList = ({ results, onTagClick, searchType }) => {
    if (!results) return null;
    const users = results.users || [];
    const hashtags = results.hashtags || [];
    const posts = results.posts || [];

    if (users.length === 0 && hashtags.length === 0 && posts.length === 0) {
        return (
            <div className="explore-empty-state content-fade-in">
                <div className="explore-empty-icon"><Ghost size={48} /></div>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить запрос.</p>
            </div>
        );
    }

    if (searchType === 'posts') {
        return (
            <div className="content-fade-in" style={{ paddingBottom: 140 }}>
                {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
        );
    }

    return (
        <div className="search-results-list content-fade-in">
            {users.length > 0 && (
                <div className="search-group">
                    <h4 className="search-group-header">Люди</h4>
                    {users.map(u => (
                        <Link to={`/profile/${u.username}`} key={u.id} className="search-result-item">
                            <div className="avatar" style={{width: 44, height: 44, fontSize: 20}}>
                                {u.avatar && u.avatar.length > 5 ? <img src={u.avatar} alt=""/> : (u.avatar || "👤")}
                            </div>
                            <div className="res-info">
                                <span className="res-name">{u.displayName}</span>
                                <span className="res-sub">@{u.username}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            
            {hashtags.length > 0 && (
                <div className="search-group">
                    <h4 className="search-group-header">Темы</h4>
                    {hashtags.map(t => (
                        <div key={t.id} className="search-result-item" onClick={() => onTagClick(t.name)}>
                            <div className="hashtag-icon-box"><Hashtag size={20} /></div>
                            <div className="res-info">
                                <span className="res-name">#{t.name}</span>
                                <span className="res-sub">{t.postsCount} постов</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {posts.length > 0 && searchType === 'all' && (
                <div className="search-group">
                    <h4 className="search-group-header">Посты</h4>
                    {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            )}
            <div style={{ height: '140px' }} />
        </div>
    );
};

export default Explore;