import React, { useLayoutEffect, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import { apiClient } from '../../api/client';
import { ShareIcon, EditIcon, DeleteIcon, PinIcon } from '../icons/MenuIcons';
import { useIsland } from '../../context/IslandContext';


const PostMenu = ({ post, isOwner, isPinned, ctrl, onClose, anchorRef }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);
    const { showIslandAlert } = useIsland();

    
    useLayoutEffect(() => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            
            
            
            setPosition({
                top: rect.bottom + scrollY + 4,
                left: rect.right + scrollX - 200 
            });
        }
    }, [anchorRef]);

    
    useEffect(() => {
        const handleClickOutside = (e) => {
            
            if (
                menuRef.current && 
                !menuRef.current.contains(e.target) &&
                anchorRef.current &&
                !anchorRef.current.contains(e.target)
            ) {
                onClose();
            }
        };

        
        
        
        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', onClose, { capture: true }); 
        window.addEventListener('resize', onClose);

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', onClose, { capture: true });
            window.removeEventListener('resize', onClose);
            
        };
    }, [onClose, anchorRef]);

    const handleShare = () => {
        const url = `...`;
        navigator.clipboard.writeText(url);
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

    const isMusicPost = post.content?.includes('#nowkie_music_track');

    
    return ReactDOM.createPortal(
        <div 
            ref={menuRef}
            className="post-dropdown-menu"
            style={{
                top: position.top,
                left: position.left,
                position: 'absolute',
                zIndex: 500, 
                marginTop: 0 
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <button onClick={handleShare}><ShareIcon /> Поделиться</button>
            {isOwner && (
                <>
                    <button onClick={handlePin}>
                        <PinIcon pinned={isPinned} /> {isPinned ? 'Открепить' : 'Закрепить'}
                    </button>
                    {!isMusicPost && (
                        <button onClick={() => { onClose(); ctrl.handleEditStart(); }}>
                            <EditIcon /> Редактировать
                        </button>
                    )}
                    <button className="delete-btn" onClick={handleDelete}>
                        <DeleteIcon /> Удалить
                    </button>
                </>
            )}
        </div>,
        document.body
    );
};

export default PostMenu;