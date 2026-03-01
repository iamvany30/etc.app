/* @source src/components/PostCard/PostMenu.jsx */
import React, { useLayoutEffect, useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import ReportModal from '../modals/ReportModal'; 
import EditPostModal from '../modals/EditPostModal';
import { apiClient } from '../../api/client';
import { ShareIcon, EditIcon, DeleteIcon, PinIcon, ReportIcon } from '../icons/MenuIcons'; 
import { useIslandStore } from '../../store/islandStore';
import { ShieldCross } from "@solar-icons/react";
import { useModalStore } from '../../store/modalStore'; 
import ConfirmActionModal from '../modals/ConfirmActionModal';
const PostMenu = ({ post, isOwner, isPinned, ctrl, onClose, anchorRef }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    const openModal = useModalStore(state => state.openModal); 
    const handleBlock = () => {
    onClose(); 
    
    openModal(
        <ConfirmActionModal 
            title="Заблокировать пользователя?"
            message={`Вы уверены, что хотите заблокировать @${post.author?.username}? Вы больше не увидите посты этого пользователя.`}
            confirmText="Заблокировать"
            isDanger={true}
            onConfirm={async () => {
                try {
                    await apiClient.blockUser(post.author.username);
                    showIslandAlert('success', 'Пользователь заблокирован', '🛡️');
                    window.location.reload(); 
                } catch (e) {
                    showIslandAlert('error', 'Ошибка блокировки', '❌');
                }
            }}
            onCancel={() => {}} 
        />
    );
};
    useLayoutEffect(() => {
        if (anchorRef.current && menuRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const menuRect = menuRef.current.getBoundingClientRect();
            const scrollY = window.scrollY || 0;
            const scrollX = window.scrollX || 0;

            setPosition({
                top: rect.bottom + scrollY + 6,
                left: rect.right + scrollX - menuRect.width
            });
        }
    }, [anchorRef]);

    const handleCloseMenu = useCallback(() => {
        onClose();
    }, [onClose]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                menuRef.current && 
                !menuRef.current.contains(e.target) &&
                anchorRef.current &&
                !anchorRef.current.contains(e.target)
            ) {
                handleCloseMenu();
            }
        };

        let isClosed = false;
        const handleScrollOrResize = () => {
            if (!isClosed) {
                isClosed = true;
                handleCloseMenu();
            }
        };

        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true }); 
        window.addEventListener('resize', handleScrollOrResize, { passive: true });

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [handleCloseMenu, anchorRef]);

    const handleShare = () => {
        
        const username = post.author?.username || 'user';
        const url = `https://xn--d1ah4a.com/@${username}/post/${post.id}`;
        
        navigator.clipboard.writeText(url);
        onClose();
        showIslandAlert('success', 'Ссылка скопирована', '🔗');
    };

    const handlePin = async () => {
        onClose();
        try {
            if (!isPinned) await apiClient.pinPost(post.id);
            else await apiClient.unpinPost(post.id);
            window.location.reload(); 
        } catch (e) { console.error(e); }
    };

    const handleEdit = () => {
        onClose();
        openModal(<EditPostModal post={post} onSuccess={ctrl.updatePostData} />);
    };

    const handleDelete = () => {
        onClose(); 
        ctrl.openModal(
            <ConfirmDeleteModal onConfirm={async () => { 
                try { 
                    await apiClient.deletePost(post.id); 
                    ctrl.setIsDeleted(true); 
                } catch {} 
            }} />
        );
    };
    
    const handleReport = () => {
        onClose();
        openModal(<ReportModal targetId={post.id} targetType="post" />);
    };

    const isMusicPost = post.content?.includes('#nowkie_music_track');

    return ReactDOM.createPortal(
        <div 
            ref={menuRef}
            className="post-dropdown-menu"
            style={{
                top: position.top,
                left: position.left,
                position: 'absolute',
                zIndex: 'var(--z-post-menu)',
                opacity: position.top === 0 ? 0 : 1
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <button onClick={handleShare}><ShareIcon /> Поделиться</button>
            
            {isOwner ? (
                <>
                    <button onClick={handlePin}>
                        <PinIcon pinned={isPinned} /> {isPinned ? 'Открепить' : 'Закрепить'}
                    </button>
                    {!isMusicPost && (
                        <button onClick={handleEdit}>
                            <EditIcon /> Редактировать
                        </button>
                    )}
                    <div className="post-menu-separator" />
                    <button className="delete-btn" onClick={handleDelete}>
                        <DeleteIcon /> Удалить
                    </button>
                </>
                ) : (
                    <>
                        <button onClick={handleBlock}>
                            <ShieldCross size={18} /> Заблокировать
                        </button>
                        
                        <div className="post-menu-separator" />
                        
                        <button className="delete-btn" onClick={handleReport}>
                            <ReportIcon /> Пожаловаться
                        </button>
                    </>
                )}
        </div>,
        document.body
    );
};

export default PostMenu;