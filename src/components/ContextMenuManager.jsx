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

    
    const isDev = process.env.NODE_ENV === 'development';

    useEffect(() => {
        const handleContextMenu = (e) => {
            if (e.shiftKey) return; 
            
            e.preventDefault();
            const target = e.target;
            const clickX = e.clientX;
            const clickY = e.clientY;

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

            
            if (isDev) {
                items.push({ isSeparator: true });
                items.push({
                    label: '🔍 Inspect Element (Dev)',
                    action: () => window.api.invoke('app:inspect-element', { x: clickX, y: clickY })
                });
            }

            if (items.length > 0) {
                openContextMenu(clickX, clickY, items);
            }
        };

        window.addEventListener('contextmenu', handleContextMenu);
        return () => window.removeEventListener('contextmenu', handleContextMenu);
    }, [openContextMenu, currentUser, navigate, isDev]);

    return null;
};

export default ContextMenuManager;