/* @source src/components/PostCard/usePostCard.js */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { useMusicStore } from '../../store/musicStore';
import { useModalStore } from '../../store/modalStore';
import { useIslandStore } from '../../store/islandStore';
import { apiClient } from '../../api/client';
import { handleGlobalLinkClick } from '../../utils/linkUtils';
import { bookmarkUtils } from '../../utils/bookmarkUtils'; 
import { historyUtils } from '../../utils/historyUtils';

const safeDecode = (str) => {
    try { return decodeURIComponent(escape(window.atob(str))); } 
    catch (e) { return "Unknown"; }
};

const findAudioAttachment = (attachments) => {
    if (!attachments) return null;
    return attachments.find(a => {
        const type = (a.mimeType || a.type || '').toLowerCase();
        const url = (a.url || '').toLowerCase();
        return type.startsWith('audio/') || type === 'video/ogg' || url.match(/\.(mp3|wav|m4a|aac)$/i);
    });
};


export const usePostCard = (post, initialShowComments, highlightCommentId, disableHistory = false) => {
    const navigate = useNavigate();
    const postRef = useRef(null);

    const currentUser = useUserStore(state => state.currentUser);
    const currentTrackId = useMusicStore(state => state.currentTrack?.id);
    const isGlobalPlaying = useMusicStore(state => state.isPlaying);
    const playTrack = useMusicStore(state => state.playTrack);
    const togglePlay = useMusicStore(state => state.togglePlay);

    const openModal = useModalStore(state => state.openModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);

    const [localPost, setLocalPost] = useState(post);
    const [isDeleted, setIsDeleted] = useState(false);
    const [liked, setLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [isReposted, setIsReposted] = useState(post.isReposted);
    const [repostsCount, setRepostsCount] = useState(post.repostsCount);
    const [wasViewed, setWasViewed] = useState(post.isViewed || false);
    const [isSaved, setIsSaved] = useState(() => bookmarkUtils.isSaved(post.id));
    
    const [showComments, setShowComments] = useState(initialShowComments || !!highlightCommentId);
    const [comments, setComments] = useState(post.comments || []);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
    const [commentsCursor, setCommentsCursor] = useState(null);
    const [replyTo, setReplyTo] = useState(null);

    const hasFetchedComments = useRef(false);

    const [hasMoreComments, setHasMoreComments] = useState(
        (post.commentsCount || 0) > (post.comments?.length || 0)
    );

    const isOwner = currentUser?.id === post.author?.id || post.isOwner;

    useEffect(() => {
        setLocalPost(post);
        setLiked(post.isLiked);
        setLikesCount(post.likesCount);
        setIsReposted(post.isReposted);
        setRepostsCount(post.repostsCount);
        setCommentsCount(post.commentsCount);
        setIsSaved(bookmarkUtils.isSaved(post.id)); 
    }, [post]);

    useEffect(() => {
        if (wasViewed || !postRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                apiClient.viewPost(localPost.id).catch(() => {});
                
                
                if (!disableHistory) {
                    historyUtils.add(localPost);
                }

                setWasViewed(true);
                observer.disconnect();
            }
        }, { threshold: 0.6 });
        observer.observe(postRef.current);
        return () => observer.disconnect();
    }, [localPost, wasViewed, disableHistory]);

    useEffect(() => {
        const handleBookmarkUpdate = () => setIsSaved(bookmarkUtils.isSaved(localPost.id));
        window.addEventListener('bookmarks-updated', handleBookmarkUpdate);
        return () => window.removeEventListener('bookmarks-updated', handleBookmarkUpdate);
    }, [localPost.id]);

    const handleLike = async (e) => {
        e.stopPropagation();
        const prevLiked = liked;
        setLiked(!prevLiked);
        setLikesCount(p => !prevLiked ? p + 1 : p - 1);
        try { await apiClient.likePost(localPost.id); } 
        catch { setLiked(prevLiked); setLikesCount(p => prevLiked ? p + 1 : p - 1); }
    };

    const handleRepost = async (e) => {
        e.stopPropagation();
        if (isOwner) return;
        const prevReposted = isReposted;
        setIsReposted(!prevReposted);
        setRepostsCount(p => !prevReposted ? p + 1 : p - 1);
        try {
            if (prevReposted) await apiClient.removeRepost(localPost.id);
            else await apiClient.repostPost(localPost.id, "");
        } catch {
            setIsReposted(prevReposted);
            setRepostsCount(p => prevReposted ? p + 1 : p - 1);
        }
    };

    const handleSave = (e) => {
        e.stopPropagation();
        const newState = bookmarkUtils.toggle(localPost);
        setIsSaved(newState);
        if (newState) showIslandAlert('success', 'Сохранено', '🔖');
    };

    const updatePostData = useCallback((newData) => {
        setLocalPost(prev => ({ ...prev, ...newData }));
    }, []);

    const handleLinkClick = useCallback((e, url) => {
        handleGlobalLinkClick(e, url, navigate, openModal);
    }, [navigate, openModal]);

    const loadComments = useCallback(async (isMore = false) => {
        if (loadingComments) return;
        if (isMore && !hasMoreComments) return;
        
        setLoadingComments(true);
        try {
            const cursor = isMore ? commentsCursor : null;
            const res = await window.api.call(`/posts/${localPost.id}/comments?limit=20${cursor ? `&cursor=${cursor}` : ''}`, 'GET');
            
            const dataObj = res?.data || res || {};
            const newComments = dataObj.comments || dataObj.data || (Array.isArray(dataObj) ? dataObj : []);
            const paginationObj = dataObj.pagination || dataObj;
            
            const nextCur = paginationObj.nextCursor || paginationObj.next_cursor || null;
            
            let hasMore = false;
            if (typeof paginationObj.hasMore === 'boolean') hasMore = paginationObj.hasMore;
            else if (typeof paginationObj.has_more === 'boolean') hasMore = paginationObj.has_more;
            else if (nextCur) hasMore = true;
            else if (newComments.length >= 20) hasMore = true;
            else if (!isMore && commentsCount > newComments.length) hasMore = true;

            setComments(prev => {
                if (!isMore) return newComments;
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNew = newComments.filter(c => !existingIds.has(c.id));
                return [...prev, ...uniqueNew];
            });

            setCommentsCursor(nextCur);
            setHasMoreComments(hasMore);
        } catch (err) {
            console.error("Comments error:", err);
        } finally {
            setLoadingComments(false);
        }
    }, [loadingComments, commentsCursor, localPost.id, hasMoreComments, commentsCount]);

    useEffect(() => { 
        if (showComments && comments.length === 0 && !hasFetchedComments.current) {
            hasFetchedComments.current = true; 
            loadComments(); 
        }
    }, [showComments, comments.length, loadComments]);

    const musicData = useMemo(() => {
        if (!localPost.content?.includes('#nowkie_music_track')) return null;
        try {
            const artistMatch = localPost.content.match(/\[artist:(.+?)\]/);
            const titleMatch = localPost.content.match(/\[title:(.+?)\]/);
            const audioAttachment = findAudioAttachment(localPost.attachments);
            const coverAttachment = localPost.attachments?.find(a => (a.mimeType || a.type || '').startsWith('image/'));

            if (artistMatch && titleMatch && audioAttachment) {
                return {
                    id: localPost.id,
                    artist: safeDecode(artistMatch[1]),
                    title: safeDecode(titleMatch[1]),
                    src: audioAttachment.url,
                    cover: coverAttachment ? coverAttachment.url : null
                };
            }
        } catch (e) { return null; }
        return null;
    }, [localPost]);

    const isThisTrackPlaying = useMemo(() => {
        return currentTrackId === localPost.id && isGlobalPlaying;
    }, [currentTrackId, localPost.id, isGlobalPlaying]);

    return {
        currentUser, localPost,
        isDeleted, setIsDeleted, wasViewed, postRef, isOwner, musicData,
        liked, likesCount, handleLike,
        isReposted, repostsCount, handleRepost,
        isSaved, handleSave, 
        updatePostData, 
        showComments, setShowComments,
        comments, setComments,
        loadingComments, commentsCount, setCommentsCount,
        hasMoreComments, loadComments,
        replyTo, setReplyTo,
        handleLinkClick, navigate, openModal,
        isThisTrackPlaying, playTrack, togglePlay
    };
};