import { useEffect } from 'react';
import { useContextMenu } from '../context/ContextMenuContext';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import * as Icons from './icons/CommonIcons';
import * as MenuIcons from './icons/MenuIcons';

const ContextMenuManager = () => {
    const { openContextMenu } = useContextMenu();
    const { currentUser } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const handleContextMenu = (e) => {
            if (e.shiftKey) return; 
            
            e.preventDefault();
            const target = e.target;
            let items = [];

            
            const linkEl = target.closest('a');
            if (linkEl) {
                const url = linkEl.href;
                const isInternal = url.includes(window.location.host) || url.startsWith('http://localhost');

                items.push({ isLabel: true, label: 'Ссылка' });
                
                if (isInternal) {
                    
                    const path = linkEl.getAttribute('href').replace('#', '');
                    items.push({
                        label: 'Перейти',
                        icon: <Icons.NavForwardIcon />,
                        action: () => navigate(path)
                    });
                }

                items.push({
                    label: 'Открыть в браузере',
                    icon: <Icons.NavReloadIcon />,
                    action: () => window.api.openExternalLink(url)
                });

                items.push({
                    label: 'Копировать адрес',
                    shortcut: 'Ctrl+C',
                    action: () => navigator.clipboard.writeText(url)
                });
                
                items.push({ isSeparator: true });
            }

            
            const postEl = target.closest('[data-context-post-id]');
            if (postEl && !linkEl) {
                const { contextPostId, contextAuthorUsername } = postEl.dataset;
                const isOwner = currentUser?.username === contextAuthorUsername;

                items.push({ isLabel: true, label: 'Пост' });
                items.push({
                    label: 'Открыть обсуждение',
                    icon: <Icons.CommentIcon />,
                    action: () => navigate(`/post/${contextPostId}`)
                });
                
                if (isOwner) {
                    items.push({ label: 'Удалить', type: 'danger', icon: <MenuIcons.DeleteIcon /> });
                }
                items.push({ isSeparator: true });
            }

            
            const selectedText = window.getSelection().toString();
            if (selectedText) {
                items.push({
                    label: 'Копировать',
                    action: () => navigator.clipboard.writeText(selectedText)
                });
            }

            items.push({
                label: 'Назад',
                action: () => window.history.back()
            });
            
            items.push({
                label: 'Перезагрузить',
                icon: <Icons.NavReloadIcon />,
                action: () => window.location.reload()
            });

            if (items.length > 0) {
                openContextMenu(e.clientX, e.clientY, items);
            }
        };

        window.addEventListener('contextmenu', handleContextMenu);
        return () => window.removeEventListener('contextmenu', handleContextMenu);
    }, [openContextMenu, currentUser, navigate]);

    return null;
};

export default ContextMenuManager;