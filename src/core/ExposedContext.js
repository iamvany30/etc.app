
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as RouterDOM from 'react-router-dom';
import { Virtuoso, VirtuosoGrid, GroupedVirtuoso } from 'react-virtuoso';


import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';
import { useMusic } from '../context/MusicContext';
import { useUpload } from '../context/UploadContext';

import * as CommonIcons from '../components/icons/CommonIcons';
import * as MediaIcons from '../components/icons/MediaIcons';
import * as MenuIcons from '../components/icons/MenuIcons';
import * as VerifyIcons from '../components/icons/VerifyIcons';
import * as SidebarIcons from '../components/icons/SidebarIcons';
import * as NotificationIcons from '../components/icons/NotificationIcons';
import * as SettingsIcons from '../components/icons/SettingsIcons';
import * as ThemeIcons from '../components/icons/ThemeIcons';
import { MusicIcon } from '../components/icons/MusicIcon';


import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import MediaGrid from '../components/MediaGrid';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import MobileNav from '../components/MobileNav';
import GlobalPlayer from '../components/GlobalPlayer';
import Comment from '../components/Comment';
import TitleBar from '../components/TitleBar';
import VoicePlayer from '../components/VoicePlayer';
import MusicPlayer from '../components/MusicPlayer';
import DrawingBoard from '../components/DrawingBoard';


import SettingsModal from '../components/modals/SettingsModal';
import EditProfileModal from '../components/modals/EditProfileModal';
import ImageModal from '../components/modals/ImageModal';
import BannerEditorModal from '../components/modals/BannerEditorModal';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';
import UserListModal from '../components/modals/UserListModal';
import ExternalLinkModal from '../components/modals/ExternalLinkModal';


import { ComponentRegistry, DynamicComponent } from './ComponentRegistry';


const utils = {
    
    formatNumber: (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },
    
    formatDuration: (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    },
    
    clsx: (...args) => args.filter(Boolean).join(' '),
    
    debounce: (func, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
};


const system = {
    
    copyToClipboard: (text) => navigator.clipboard.writeText(text).catch(console.error),
    
    openExternal: (url) => {
        if (window.api?.openExternalLink) window.api.openExternalLink(url);
        else window.open(url, '_blank');
    }
};

/**
 * Главная функция, которая собирает все экспорты в единый глобальный объект `window.ItdApp`
 */
export const setupExposedContext = () => {
    window.ItdApp = {
        
        React,
        ReactDOM,
        RouterDOM,
        Virtuoso: { Virtuoso, VirtuosoGrid, GroupedVirtuoso },

        
        DynamicComponent,
        register: ComponentRegistry.register,
        getComponent: ComponentRegistry.get,
        
        
        api: apiClient,
        
        
        hooks: {
            
            useUser, 
            useModal, 
            useMusic,
            useUpload,
            
            useState: React.useState,
            useEffect: React.useEffect,
            useCallback: React.useCallback,
            useMemo: React.useMemo,
            useRef: React.useRef,
            useContext: React.useContext,
            useLayoutEffect: React.useLayoutEffect,
            useReducer: React.useReducer,
            
            
            useNavigate: RouterDOM.useNavigate,
            useLocation: RouterDOM.useLocation,
            useParams: RouterDOM.useParams,
            useSearchParams: RouterDOM.useSearchParams
        },

        
        utils,
        system,

        
        unload: (fileList) => {
            if (!Array.isArray(fileList)) return;
            document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
                const content = el.tagName === 'STYLE' ? el.textContent : el.href;
                if (fileList.some(name => content.includes(name))) {
                    el.disabled = true;
                    el.dataset.themeUnloaded = 'true';
                }
            });
        },
        restoreAllStyles: () => {
            document.querySelectorAll('[data-theme-unloaded="true"]').forEach(el => {
                el.disabled = false;
                delete el.dataset.themeUnloaded;
            });
        },

        
        Icons: { 
            ...CommonIcons,
            ...MediaIcons, 
            ...MenuIcons, 
            ...VerifyIcons, 
            ...SidebarIcons, 
            ...NotificationIcons, 
            ...SettingsIcons,
            ...ThemeIcons,
            MusicIcon 
        },
        
        
        Components: { 
            PostCard, 
            CreatePost, 
            MediaGrid, 
            Sidebar, 
            RightSidebar, 
            MobileNav, 
            GlobalPlayer, 
            Comment, 
            TitleBar,
            VoicePlayer,
            MusicPlayer,
            DrawingBoard
        },
        
        
        Modals: { 
            SettingsModal, 
            EditProfileModal, 
            ImageModal,
            BannerEditorModal,
            ConfirmDeleteModal,
            UserListModal,
            ExternalLinkModal
        },
    };
};