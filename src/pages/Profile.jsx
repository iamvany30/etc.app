import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';
import { getInitials } from '../utils/avatarUtils';

import PostCard from '../components/PostCard';
import { DynamicComponent } from '../core/ComponentRegistry';
import CreatePostFallback from '../components/CreatePost';
import EditProfileModal from '../components/modals/EditProfileModal';
import SettingsModal from '../components/modals/SettingsModal';
import UserListModal from '../components/modals/UserListModal';
import BannerEditorModal from '../components/modals/BannerEditorModal';
import { ProfileSkeleton, PostSkeleton } from '../components/Skeletons';

import { VerifiedBlue, VerifiedGold } from '../components/icons/VerifyIcons';

import '../styles/Profile.css';

const GOLD_VERIFIED_IDS = ['48f4cd67-58a2-4c0d-b1be-235fc4bb91a4'];

const CameraIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>);
const SettingsIcon = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>);
const CalendarIcon = () => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6, opacity: 0.7}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);


function declension(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

const Profile = () => {
    const { username } = useParams();
    const { currentUser, setCurrentUser } = useUser();
    const { openModal } = useModal();
    
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('posts'); 
    
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    const nextCursorRef = useRef(null);
    const hasMoreRef = useRef(true);
    const isFetchingRef = useRef(false);
    const virtuosoRef = useRef(null);

    const isMyProfile = currentUser?.username === username;

    const displayPosts = useMemo(() => {
        if (!user?.pinnedPostId || activeTab !== 'posts' || posts.length === 0) {
            return posts;
        }
        const pinnedIdx = posts.findIndex(p => p.id === user.pinnedPostId);
        if (pinnedIdx === -1) return posts; 
        
        const pinnedPost = posts[pinnedIdx];
        const otherPosts = posts.filter((_, i) => i !== pinnedIdx);
        return [pinnedPost, ...otherPosts];
    }, [posts, user?.pinnedPostId, activeTab]);

    const fetchProfile = useCallback(async () => {
        if (!username) return;
        setLoadingProfile(true);
        try {
            const profileRes = await apiClient.getProfile(username);
            const userData = profileRes?.user || profileRes?.data || profileRes;

            if (userData && (userData.id || userData.username)) {
                
                const processedUser = {
                    ...userData,
                    
                    isOnline: !!(userData.online || userData.isOnline),
                    
                    lastSeen: userData.lastSeen || userData.last_seen || null,
                    showLastSeen: userData.showLastSeen
                };
                
                setUser(processedUser);
                setIsFollowing(processedUser.isFollowing);
                setFollowersCount(processedUser.followersCount || 0);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Ошибка загрузки профиля:", error);
            setUser(null);
        } finally {
            setLoadingProfile(false);
        }
    }, [username]);

    const loadPosts = useCallback(async (isInitial = false) => {
        if (!username) return;
        if (isFetchingRef.current || (!isInitial && !hasMoreRef.current)) return;

        isFetchingRef.current = true;
        if (isInitial) {
            setLoadingPosts(true);
            setPosts([]);
            nextCursorRef.current = null;
            hasMoreRef.current = true;
        }

        try {
            const cursor = isInitial ? null : nextCursorRef.current;
            let res;
            
            if (activeTab === 'posts') {
                res = await apiClient.getUserPosts(username, cursor);
            } else {
                res = await apiClient.getUserLikedPosts(username, cursor);
            }

            const responseData = res?.posts || res?.data?.posts || [];
            const pagination = res?.pagination || res?.data?.pagination;

            if (isInitial) {
                setPosts(responseData);
            } else {
                setPosts(prev => [...prev, ...responseData]);
            }

            if (pagination) {
                nextCursorRef.current = pagination.nextCursor;
                hasMoreRef.current = pagination.hasMore;
            } else {
                hasMoreRef.current = false;
            }
        } catch (e) {
            console.error("Ошибка загрузки постов:", e);
        } finally {
            setLoadingPosts(false);
            isFetchingRef.current = false;
        }
    }, [username, activeTab]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);
    useEffect(() => { loadPosts(true); }, [username, activeTab, loadPosts]);

    const handleFollowToggle = async () => {
        if (!user || isMyProfile) return;
        const prevState = isFollowing;
        const prevCount = followersCount;
        
        setIsFollowing(!prevState);
        setFollowersCount(prevState ? prevCount - 1 : prevCount + 1);
        
        try {
            if (prevState) await apiClient.unfollowUser(user.username);
            else await apiClient.followUser(user.username);
        } catch (e) {
            setIsFollowing(prevState);
            setFollowersCount(prevCount);
        }
    };

    const handleBannerUpdate = (newUrl) => {
        setUser(prev => ({ ...prev, banner: newUrl }));
        if (isMyProfile) setCurrentUser(prev => ({ ...prev, banner: newUrl }));
    };
    
    const handlePostCreated = (newPost) => {
        if (activeTab === 'posts') {
            setPosts(prev => [newPost, ...prev]);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    };

    
    const renderOnlineStatus = () => {
        if (!user) return null;
        
        
        if (user.isOnline) {
            return <div className="online-status-badge">В сети</div>;
        }

        
        
        if (user.showLastSeen === false) {
             return <div className="offline-status-badge">Не в сети</div>;
        }

        
        if (!user.lastSeen) {
             return <div className="offline-status-badge">Не в сети</div>;
        }

        const date = new Date(user.lastSeen);
        if (isNaN(date.getTime())) {
             return <div className="offline-status-badge">Не в сети</div>;
        }

        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);
        let timeText = '';

        if (diffSeconds < 60) {
            timeText = 'только что';
        } else if (diffSeconds < 3600) {
            const m = Math.max(1, Math.floor(diffSeconds / 60));
            timeText = `${m} ${declension(m, ['минуту', 'минуты', 'минут'])} назад`;
        } else if (diffSeconds < 86400) { 
            const h = Math.floor(diffSeconds / 3600);
            timeText = `${h} ${declension(h, ['час', 'часа', 'часов'])} назад`;
        } else if (diffSeconds < 172800) { 
            timeText = 'вчера';
        } else {
            
            timeText = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        }

        
        
        return <div className="offline-status-badge">Был(а) {timeText}</div>;
    };

    const ProfileHeader = useMemo(() => {
        if (!user) return null;
        const hasGoldVerify = GOLD_VERIFIED_IDS.includes(user.id);
        const hasBlueVerify = user.verified && !hasGoldVerify;
        const isMutual = user.isFollowing && user.isFollowedBy;
        const followsYou = user.isFollowedBy && !user.isFollowedBy;
        const formattedRegDate = formatDate(user.createdAt);
        
        const isAvatarUrl = user.avatar && user.avatar.startsWith('http');
        const avatarContent = isAvatarUrl ? (
            <img src={user.avatar} alt={user.username} className="profile-avatar-img" />
        ) : (
            user.avatar ? user.avatar : getInitials(user.displayName || user.username)
        );

        return (
            <div className="profile-header-wrapper">
                <div className="profile-banner">
                    {user.banner ? (
                        <img src={user.banner} alt="Banner" className="profile-banner__image" />
                    ) : (
                        <div className="profile-banner__placeholder" />
                    )}
                    {isMyProfile && (
                        <button className="edit-banner-btn" onClick={() => openModal(<BannerEditorModal onSaveSuccess={handleBannerUpdate} />)} title="Изменить обложку">
                            <CameraIcon />
                        </button>
                    )}
                </div>
                
                <div className="profile-header-top">
                    <div className="profile-avatar-wrapper">
                        
                        {user.isOnline && <div className="avatar-online-indicator" />}
                        
                        <div className="profile-avatar-placeholder">
                            {avatarContent}
                        </div>
                    </div>
                    
                    <div className="profile-actions">
                        {isMyProfile ? (
                            <div style={{display: 'flex', gap: '8px'}}>
                                <button className="profile-btn outline" onClick={() => openModal(<EditProfileModal />)}>Редактировать</button>
                                <button className="profile-btn outline" style={{padding: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center'}} onClick={() => openModal(<SettingsModal />)} title="Настройки">
                                    <SettingsIcon />
                                </button>
                            </div>
                        ) : (
                            <button className={`profile-btn ${isFollowing ? 'outline' : 'filled'}`} onClick={handleFollowToggle}>
                                {isFollowing ? 'Читаю' : 'Читать'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="profile-details">
                    <div className="profile-names">
                        <div className="profile-display-name-row">
                            <h1 className="profile-display-name">{user.displayName}</h1>
                            {hasGoldVerify && <VerifiedGold title="Официальный аккаунт" style={{marginLeft: 4}} />}
                            {hasBlueVerify && <VerifiedBlue title="Подтвержденный аккаунт" style={{marginLeft: 4}} />}
                            
                            
                            {renderOnlineStatus()}
                        </div>
                        <span className="profile-username">@{user.username}</span>
                        <div className="profile-badges-row">
                            {isMutual && <span className="mutual-badge">Взаимная подписка</span>}
                            {followsYou && <span className="mutual-badge">Подписан(а) на вас</span>}
                        </div>
                    </div>
                    
                    {user.bio && <p className="profile-bio">{user.bio}</p>}
                    
                    {formattedRegDate && (
                        <div className="profile-meta-info">
                            <div className="profile-join-date">
                                <CalendarIcon />
                                <span>Регистрация: {formattedRegDate}</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="profile-stats">
                        <button className="stat-item" onClick={() => openModal(<UserListModal username={username} type="following" title="Читаемые" />)}>
                            <span className="stat-value">{user.followingCount || 0}</span>
                            <span className="stat-label">в читаемых</span>
                        </button>
                        <button className="stat-item" onClick={() => openModal(<UserListModal username={username} type="followers" title="Читатели" />)}>
                            <span className="stat-value">{followersCount}</span>
                            <span className="stat-label">читателей</span>
                        </button>
                    </div>
                </div>

                <nav className="profile-tabs">
                    <button className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                        <span className="tab-content">Посты</span>
                    </button>
                    <button className={`profile-tab ${activeTab === 'likes' ? 'active' : ''}`} onClick={() => setActiveTab('likes')}>
                        <span className="tab-content">Нравится</span>
                    </button>
                </nav>

                <div className="profile-content-header">
                    {isMyProfile && activeTab === 'posts' && (
                        <DynamicComponent name="Components.CreatePost" fallback={CreatePostFallback} onPostCreated={handlePostCreated} />
                    )}
                    
                    {loadingPosts && posts.length === 0 && <div style={{padding: '16px'}}><PostSkeleton /></div>}
                    
                    {!loadingPosts && posts.length === 0 && (
                        <div className="empty-state">
                            <h3>{activeTab === 'posts' ? 'Нет постов' : 'Нет отметок "Нравится"'}</h3>
                            <p style={{marginTop: 8, color: 'var(--color-text-secondary)'}}>
                                {activeTab === 'posts' 
                                    ? (isMyProfile ? 'Опубликуйте что-нибудь!' : 'Пользователь пока ничего не публиковал.')
                                    : 'Здесь появятся посты, которые вам понравились.'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }, [user, isMyProfile, isFollowing, followersCount, activeTab, loadingPosts, posts.length, username, openModal, currentUser]);

    if (loadingProfile) return <div className="profile-page" style={{padding: 20}}><ProfileSkeleton /></div>;
    if (!user) return <div className="empty-state" style={{marginTop: 100}}><h2>Пользователь не найден</h2><p>Такого аккаунта не существует или он был удален.</p></div>;

    return (
        <div className="profile-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Virtuoso
                ref={virtuosoRef}
                style={{ flexGrow: 1 }}
                data={displayPosts}
                endReached={() => loadPosts(false)}
                overscan={1000}
                components={{
                    Header: () => ProfileHeader,
                    Footer: () => hasMoreRef.current && posts.length > 0 ? (
                        <div style={{padding: 20}}><PostSkeleton /></div>
                    ) : (
                        <div style={{height: 140}} />
                    )
                }}
                itemContent={(index, post) => (
                    <div style={{ paddingBottom: 1 }}>
                        <PostCard 
                            post={post} 
                            key={post.id} 
                            isPinned={user?.pinnedPostId === post.id} 
                        />
                    </div>
                )}
            />
        </div>
    );
};

export default Profile;