import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Link, useSearchParams } from 'react-router-dom';
import PostCard from '../components/PostCard'; 

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const Explore = () => {
    const [data, setData] = useState({ trending: [], clans: [], users: [] });
    
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParam = searchParams.get('q'); 

    const [searchQuery, setSearchQuery] = useState(queryParam || "");
    const [searchResults, setSearchResults] = useState(null); 
    const [hashtagPosts, setHashtagPosts] = useState([]); 
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);

    
    const isHashtagMode = searchQuery.trim().startsWith('#');

    
    useEffect(() => {
        if (queryParam) {
            setSearchQuery(queryParam);
        } else {
            setSearchQuery("");
            setHashtagPosts([]);
            setSearchResults(null);
        }
    }, [queryParam]);

    
    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            try {
                const [trendingRes, clansRes, usersRes] = await Promise.all([
                    apiClient.getExplore(),
                    apiClient.getTopClans(),
                    apiClient.getSuggestions()
                ]);
                setData({
                    trending: trendingRes?.data?.hashtags || [],
                    clans: clansRes?.clans || [],
                    users: usersRes?.users || [],
                });
            } catch (err) {
                console.error("Ошибка загрузки данных:", err);
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, []);

    
    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.trim().length > 1) {
                setIsSearching(true);
                
                
                if (isHashtagMode) {
                    try {
                        const res = await apiClient.getHashtagPosts(searchQuery);
                        const posts = res?.data?.posts || res?.posts || [];
                        setHashtagPosts(posts);
                        setSearchResults(null); 
                    } catch (e) {
                        console.error("Hashtag search failed", e);
                    }
                } 
                
                else {
                    try {
                        const res = await apiClient.search(searchQuery);
                        setSearchResults(res?.data || res);
                        setHashtagPosts([]); 
                    } catch (e) {
                        console.error("Global search failed", e);
                    }
                }
                setIsSearching(false);
            } else {
                setSearchResults(null);
                setHashtagPosts([]);
                if (searchQuery === "") setSearchParams({}, { replace: true });
            }
        };

        const delayDebounceFn = setTimeout(() => {
            
            if (searchQuery !== queryParam) {
                if (searchQuery.trim().length > 0) {
                    setSearchParams({ q: searchQuery }, { replace: true });
                }
            }
            performSearch();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, setSearchParams, isHashtagMode, queryParam]);

    
    const SearchResultsContent = () => {
        if (isSearching) return <div className="loading-indicator">Поиск...</div>;

        
        if (isHashtagMode) {
            if (hashtagPosts.length === 0) {
                return (
                    <div className="empty-state">
                        <h3>Нет постов с тегом {searchQuery}</h3>
                        <p>Будьте первым, кто напишет об этом!</p>
                    </div>
                );
            }
            return (
                <div className="post-list">
                    <h2 className="explore-section__title">Результаты по тегу {searchQuery}</h2>
                    {hashtagPosts.map((post, index) => (
                        <PostCard key={`${post.id}-${index}`} post={post} />
                    ))}
                </div>
            );
        }

        
        if (!searchResults) return null;
        
        const { users, hashtags } = searchResults;
        const hasResults = (users?.length > 0) || (hashtags?.length > 0);

        if (!hasResults) return <div className="empty-state">Ничего не найдено</div>;

        return (
            <div>
                {users && users.length > 0 && (
                    <div className="explore-section">
                        <h2 className="explore-section__title">Люди</h2>
                        {users.map(user => (
                            <Link to={`/profile/${user.username}`} key={user.id} className="explore-item">
                                <div className="avatar" style={{width: 40, height: 40, marginRight: 12, fontSize: 20}}>
                                    {user.avatar}
                                </div>
                                <div className="explore-item-info">
                                    <span className="explore-item-name">{user.displayName}</span>
                                    <span className="explore-item-meta">@{user.username}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {hashtags && hashtags.length > 0 && (
                    <div className="explore-section">
                        <h2 className="explore-section__title">Темы</h2>
                        {hashtags.map(tag => (
                            <Link 
                                to={`/explore?q=${encodeURIComponent('#' + tag.name)}`} 
                                key={tag.id} 
                                className="explore-item"
                                onClick={() => setSearchQuery('#' + tag.name)} 
                            >
                                <div className="explore-item-info">
                                    <span className="explore-item-name">#{tag.name}</span>
                                    <span className="explore-item-meta">{tag.postsCount} постов</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const DefaultExploreContent = () => (
        <>
            <section className="explore-section">
                <h2 className="explore-section__title">Актуальные темы</h2>
                {data.trending.map((tag, index) => (
                    <Link 
                        to={`/explore?q=${encodeURIComponent('#' + tag.name)}`} 
                        key={tag.id} 
                        className="explore-item"
                        onClick={() => setSearchQuery('#' + tag.name)}
                    >
                        <span className="explore-item-rank">{index + 1}</span>
                        <div className="explore-item-info">
                            <span className="explore-item-name">#{tag.name}</span>
                            <span className="explore-item-meta">{tag.postsCount.toLocaleString()} постов</span>
                        </div>
                    </Link>
                ))}
            </section>

            <section className="explore-section">
                <h2 className="explore-section__title">Топ кланов</h2>
                <div className="top-clans__list">
                    {data.clans.map((clan, index) => (
                        <div key={index} className={`clan-tag ${index < 3 ? 'top-3' : ''}`}>
                            <span>{index + 1}. {clan.avatar}</span>
                            <span style={{opacity: 0.7, marginLeft: 4}}>{clan.memberCount}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="explore-section">
                <h2 className="explore-section__title">Кого читать</h2>
                {data.users.map(user => (
                    <Link to={`/profile/${user.username}`} key={user.id} className="explore-item">
                        <div className="avatar" style={{width: 40, height: 40, marginRight: 12, fontSize: 20}}>
                            {user.avatar}
                        </div>
                        <div className="explore-item-info">
                            <span className="explore-item-name">{user.displayName}</span>
                            <span className="explore-item-meta">@{user.username}</span>
                        </div>
                    </Link>
                ))}
            </section>
        </>
    );

    return (
        <div className="explore-container">
            <div className="explore-header">
                <div className="search-bar-wrapper">
                    <div className="search-icon-absolute">
                        <SearchIcon />
                    </div>
                    <input 
                        type="text" 
                        className="search-input"
                        placeholder="Поиск по людям и темам"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {searchQuery.trim().length > 1 ? (
                <SearchResultsContent />
            ) : (
                loading ? <div className="loading-indicator">Загрузка...</div> : <DefaultExploreContent />
            )}
        </div>
    );
};

export default Explore;