import React from 'react';
import ExternalLinkModal from '../components/modals/ExternalLinkModal';

const ALLOWED_LINKS_URL = 'https://raw.githubusercontent.com/iamvany30/etc.app_theme/main/allowed_links.json';

const FILE_EXTENSIONS = [
    '.mp3', '.wav', '.m4a', '.aac', '.mp4', '.webm', '.mov', 
    '.zip', '.rar', '.7z', '.tar', '.gz', 
    '.exe', '.dmg', '.apk', '.msi',
    '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'
];

export const updateRemoteAllowedLinks = async () => {
    try {
        const response = await fetch(`${ALLOWED_LINKS_URL}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data && Array.isArray(data.allowed)) {
            localStorage.setItem('itd_remote_allowed_links', JSON.stringify(data.allowed));
            console.log('[Links] Удаленный белый список обновлен:', data.allowed);
        }
    } catch (e) {
        console.error('[Links] Не удалось обновить белый список:', e);
    }
};

export const isFileLink = (url) => {
    try {
        const { pathname } = new URL(url);
        return FILE_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext));
    } catch (e) { return false; }
};

export const isInternalDomain = (url) => {
    try {
        const { hostname } = new URL(url);
        return ['xn--d1ah4a.com', 'итд.com', 'итд.app', 'localhost'].some(d => hostname === d || hostname.endsWith('.' + d));
    } catch (e) { return false; }
};

export const checkIsTrusted = (url) => {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        const fullUrl = urlObj.href.toLowerCase().replace(/\/$/, "");

        const staticTrusted = ['google.com', 'youtube.com', 'github.com', 't.me', 'vk.com', 'yandex.ru', 'youtu.be'];
        if (staticTrusted.some(d => hostname === d || hostname.endsWith('.' + d))) return true;

        if (isInternalDomain(url)) return true;

        const userWhitelist = JSON.parse(localStorage.getItem('itd_whitelist') || '[]');
        if (userWhitelist.includes(hostname)) return true;

        const remoteWhitelist = JSON.parse(localStorage.getItem('itd_remote_allowed_links') || '[]');
        
        for (let entry of remoteWhitelist) {
            let cleanEntry = entry.toLowerCase().trim();
            if (cleanEntry.includes('*all*')) {
                const prefix = cleanEntry.split('*all*')[0].replace(/\/$/, "");
                if (fullUrl.startsWith(prefix)) return true;
            } else {
                const entryNoSlash = cleanEntry.replace(/\/$/, "");
                if (fullUrl === entryNoSlash || hostname === entryNoSlash) return true;
            }
        }
    } catch (e) { return false; }
    return false;
};

export const handleGlobalLinkClick = (e, url, navigate, openModal) => {
    if (e && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (!url) return;

    if (isFileLink(url)) {
        if (window.api?.downloadFile) window.api.downloadFile(url);
        else window.open(url, '_blank');
        return;
    }

    if (isInternalDomain(url)) {
        try {
            const urlObj = new URL(url);
            let targetPath = urlObj.pathname + urlObj.search + urlObj.hash;
            
            const postMatch = targetPath.match(/^\/@[^/]+\/post\/([^/]+)/);
            if (postMatch) {
                navigate(`/post/${postMatch[1]}`);
                return;
            }

            const routeMap = {
                '/feed': '/',
                '/explore': '/explore',
                '/music': '/music',
                '/notifications': '/notifications',
                '/downloads': '/downloads'
            };

            const cleanPath = urlObj.pathname.replace(/\/$/, '');
            navigate(routeMap[cleanPath] || targetPath);
            return;
        } catch (err) {
            console.error('[Nav] Error:', err);
        }
    }

    const isTrusted = checkIsTrusted(url);
    const useInternalBrowser = localStorage.getItem('itd_use_internal_browser') === 'true';

    if (isTrusted) {
        if (useInternalBrowser) {
             
             window.dispatchEvent(new CustomEvent('open-internal-browser', { detail: url }));
        } else {
             if (window.api?.openExternalLink) window.api.openExternalLink(url);
             else window.open(url, '_blank');
        }
    } else {
         openModal(<ExternalLinkModal url={url} />);
    }
};