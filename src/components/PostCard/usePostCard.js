import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useModal } from '../../context/ModalContext';
import { apiClient } from '../../api/client';
import ExternalLinkModal, { isTrustedLink } from '../modals/ExternalLinkModal';
import { reconstructMarkdown } from '../../utils/markdownUtils';


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

export const usePostCard = (post, initialShowComments, highlightCommentId) => {
    const { currentUser } = useUser();
    const { openModal } = useModal();
    const navigate = useNavigate();
    
    
    const postRef = useRef(null);
    const textareaRef = useRef(null);

    
    const [localPost, setLocalPost] = useState(post);
    const [isDeleted, setIsDeleted] = useState(false);
    const [liked, setLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [isReposted, setIsReposted] = useState(post.isReposted);
    const [repostsCount, setRepostsCount] = useState(post.repostsCount);
    const [wasViewed, setWasViewed] = useState(post.isViewed || false);
    
    
    const [showComments, setShowComments] = useState(initialShowComments || !!highlightCommentId);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount);
    const [commentsCursor, setCommentsCursor] = useState(null);
    const [hasMoreComments, setHasMoreComments] = useState(false);
    const [replyTo, setReplyTo] = useState(null);

    
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");

    const isOwner = currentUser?.id === post.author?.id || post.isOwner;

    
    useEffect(() => {
        setLocalPost(post);
        setLiked(post.isLiked);
        setLikesCount(post.likesCount);
        setIsReposted(post.isReposted);
        setRepostsCount(post.repostsCount);
        setCommentsCount(post.commentsCount);
    }, [post]);

    
    useEffect(() => {
        if (wasViewed || !postRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                apiClient.viewPost(localPost.id).catch(() => {});
                setWasViewed(true);
                observer.disconnect();
            }
        }, { threshold: 0.6 });
        observer.observe(postRef.current);
        return () => observer.disconnect();
    }, [localPost.id, wasViewed]);

    
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

    const handleEditStart = () => {
        const rawMarkdown = reconstructMarkdown(localPost.content, localPost.spans || []);
        setEditContent(rawMarkdown);
        setIsEditing(true);
    };

    const handleEditSave = async () => {
        if (!editContent.trim()) return;
        try {
            const res = await apiClient.editPost(localPost.id, editContent);
            if (res && !res.error) { 
                setLocalPost(prev => ({ 
                    ...prev, 
                    content: res.data?.content || editContent,
                    spans: res.data?.spans || []
                })); 
                setIsEditing(false); 
            }
        } catch (e) { console.error(e); }
    };

    const handleLinkClick = useCallback((e, url) => {
        e.preventDefault();
        e.stopPropagation();
        if (isTrustedLink(url)) window.api.openExternalLink(url);
        else openModal(<ExternalLinkModal url={url} />);
    }, [openModal]);

    const loadComments = useCallback(async (isMore = false) => {
        if (loadingComments) return;
        setLoadingComments(true);
        try {
            const cursor = isMore ? commentsCursor : null;
            const res = await window.api.call(`/posts/${localPost.id}/comments?limit=20${cursor ? `&cursor=${cursor}` : ''}`, 'GET');
            const newComments = res?.data?.comments || res?.comments || [];
            const pagination = res?.data?.pagination || res?.pagination;

            setComments(prev => isMore ? [...prev, ...newComments] : newComments);
            setCommentsCursor(pagination?.nextCursor || null);
            setHasMoreComments(pagination?.hasMore || false);
        } catch (err) {
            console.error("Comments error:", err);
        } finally {
            setLoadingComments(false);
        }
    }, [loadingComments, commentsCursor, localPost.id]);

    useEffect(() => { 
        if (showComments && comments.length === 0) loadComments(); 
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

    return {
        
        currentUser,
        localPost,
        isDeleted, setIsDeleted,
        wasViewed,
        postRef,
        isOwner,
        
        
        musicData,

        
        liked, likesCount, handleLike,
        isReposted, repostsCount, handleRepost,
        
        
        isEditing, setIsEditing,
        editContent, setEditContent,
        textareaRef,
        handleEditStart,
        handleEditSave,

        
        showComments, setShowComments,
        comments, setComments,
        loadingComments,
        commentsCount, setCommentsCount,
        hasMoreComments, loadComments,
        replyTo, setReplyTo,

        
        handleLinkClick,
        navigate,
        openModal
    };
};