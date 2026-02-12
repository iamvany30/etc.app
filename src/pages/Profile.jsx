import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';

import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';  
import EditProfileModal from '../components/modals/EditProfileModal';
import SettingsModal from '../components/modals/SettingsModal';
import UserListModal from '../components/modals/UserListModal';
import BannerEditorModal from '../components/modals/BannerEditorModal';
import { ProfileSkeleton, PostSkeleton } from '../components/Skeletons';

import { VerifiedBlue, VerifiedGold } from '../components/icons/VerifyIcons';
import '../styles/Profile.css';

 
const GOLD_VERIFIED_IDS = [
    '48f4cd67-58a2-4c0d-b1be-235fc4bb91a4'
];

 
const CameraIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

 
const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

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

    const fetchProfile = useCallback(async () => {
        if (!username) return;
        setLoadingProfile(true);
        try {
            const profileRes = await apiClient.getProfile(username);
            const userData = profileRes?.data || profileRes?.user || profileRes;

            if (userData && (userData.id || userData.username)) {
                setUser(userData);
                setIsFollowing(userData.isFollowing);
                setFollowersCount(userData.followersCount || 0);
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

            const responseData = res?.data || res;
            const newPosts = responseData?.posts || [];
            const pagination = responseData?.pagination;

            if (isInitial) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
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

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        loadPosts(true);
    }, [username, activeTab, loadPosts]);

    const handleFollowToggle = async () => {
        if (!user || isMyProfile) return;
        const prevState = isFollowing;
        const prevCount = followersCount;
        
        setIsFollowing(!prevState);
        setFollowersCount(prevState ? prevCount - 1 : prevCount + 1);
        
        try {
            if (prevState) {
                await apiClient.unfollowUser(user.username);
            } else {
                await apiClient.followUser(user.username);
            }
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

    const ProfileHeader = useMemo(() => {
        if (!user) return null;
        
        const hasGoldVerify = GOLD_VERIFIED_IDS.includes(user.id);
        const hasBlueVerify = user.verified && !hasGoldVerify;
        const isMutual = user.isFollowing && user.isFollowedBy;
        const followsYou = user.isFollowedBy && !user.isFollowing;

        return (
            <div className="profile-header-wrapper">
                <div className="profile-banner">
                    {user.banner ? (
                        <img src={user.banner} alt="Banner" className="profile-banner__image" />
                    ) : (
                        <div className="profile-banner__placeholder" />
                    )}
                    
                    {isMyProfile && (
                        <button 
                            className="edit-banner-btn" 
                            onClick={() => openModal(<BannerEditorModal onSaveSuccess={handleBannerUpdate} />)} 
                            title="Изменить обложку"
                        >
                            <CameraIcon />
                        </button>
                    )}
                </div>

                <div className="profile-header-top">
                    <div className="profile-avatar-wrapper">
                        {user.avatar && user.avatar.length > 4 ? (
                             <img src={user.avatar} alt={user.username} className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-placeholder">{user.avatar || "👤"}</div>
                        )}
                    </div>
                    
                    <div className="profile-actions">
                        {isMyProfile ? (
                            <div style={{display: 'flex', gap: '8px'}}>
                                <button className="profile-btn outline" onClick={() => openModal(<EditProfileModal />)}>
                                    Редактировать
                                </button>
                                <button 
                                    className="profile-btn outline" 
                                    style={{padding: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center'}} 
                                    onClick={() => openModal(<SettingsModal />)}
                                    title="Настройки"
                                >
                                    <SettingsIcon />
                                </button>
                            </div>
                        ) : (
                            <button 
                                className={`profile-btn ${isFollowing ? 'outline' : 'filled'}`} 
                                onClick={handleFollowToggle}
                            >
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
                            
                            {isMutual && <span className="mutual-badge">Взаимная подписка</span>}
                            {followsYou && <span className="mutual-badge">Подписан(а) на вас</span>}
                        </div>
                        <span className="profile-username">@{user.username}</span>
                    </div>

                    {user.bio && <p className="profile-bio">{user.bio}</p>}

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
                        <CreatePost onPostCreated={handlePostCreated} />
                    )}
                    
                    {loadingPosts && posts.length === 0 && (
                        <div style={{padding: '16px'}}><PostSkeleton /></div>
                    )}

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
    }, [user, isMyProfile, isFollowing, followersCount, activeTab, loadingPosts, posts.length, username, openModal]);

    if (loadingProfile) return (
        <div className="profile-page" style={{padding: 20}}>
            <ProfileSkeleton />
        </div>
    );

    if (!user) return (
        <div className="empty-state" style={{marginTop: 100}}>
            <h2>Пользователь не найден</h2>
            <p>Такого аккаунта не существует или он был удален.</p>
        </div>
    );

    return (
        <div className="profile-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Virtuoso
                ref={virtuosoRef}
                style={{ flexGrow: 1 }}
                data={posts}
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
                        <PostCard post={post} key={post.id} />
                    </div>
                )}
            />
        </div>
    );
};

export default Profile;