/* @source src/core/UnifiedCache.js */
import { storage } from '../utils/storage';

const getUserIdPrefix = () => {
    try {
        const u = JSON.parse(localStorage.getItem('nowkie_user'));
        return u?.id ? `${u.id}_` : 'guest_';
    } catch(e) { return 'guest_'; }
};

export const UnifiedCache = {
    async analyzeAndCache(endpoint, data) {
        if (!data) return;
        const prefix = getUserIdPrefix();

        
        let postsFound = [];
        if (data.posts) postsFound = data.posts;
        else if (data.data?.posts) postsFound = data.data.posts;
        else if (data.notification?.post) postsFound = [data.notification.post];
        else if (Array.isArray(data) && data[0]?.author) postsFound = data;

        if (postsFound.length > 0 && !endpoint.includes('/posts/user/')) {
            this.processPosts(postsFound, prefix);
        }

        const isFirstPage = !endpoint.includes('cursor=') && (!endpoint.includes('offset=') || endpoint.includes('offset=0'));

        if (isFirstPage) {
            
            if (endpoint.includes('/posts?')) {
                const tab = new URLSearchParams(endpoint.split('?')[1]).get('tab') || 'popular';
                storage.set(`unified_v2_${prefix}feed_${tab}`, data);
            }
            
            else if (endpoint.includes('/posts/user/')) {
                const username = endpoint.split('/posts/user/')[1].split('?')[0];
                const clonedData = JSON.parse(JSON.stringify(data));
                
                const targetArr = clonedData.posts || clonedData.data?.posts;
                if (targetArr && Array.isArray(targetArr)) {
                    
                    const pinned = targetArr.find(p => p.isPinned);
                    const top3 = targetArr.filter(p => !p.isPinned).slice(0, 3);
                    const subset = pinned ? [pinned, ...top3] : top3;
                    
                    if (clonedData.posts) clonedData.posts = subset;
                    else clonedData.data.posts = subset;
                    
                    storage.set(`unified_v2_${prefix}profile_posts_${username}`, clonedData);
                    
                    
                    this.prefetchMediaForPosts(targetArr);
                }
            }
            
            else if (endpoint.startsWith('/users/') && !endpoint.includes('/posts/') && !endpoint.includes('/followers') && !endpoint.includes('/following')) {
                const username = endpoint.split('/users/')[1].split('?')[0];
                storage.set(`unified_v2_${prefix}profile_info_${username}`, data);
                
                const userData = data.user || data.data || data;
                this.prefetchMediaUrls([userData.avatar, userData.banner]);
            }
            
            else if (endpoint.includes('/followers')) {
                const username = endpoint.split('/users/')[1].split('/followers')[0];
                storage.set(`unified_v2_${prefix}followers_${username}`, data);
                
                const users = data.users || data.data?.users || [];
                this.prefetchMediaUrls(users.slice(0, 20).map(u => u.avatar));
            }
            
            else if (endpoint.includes('/following')) {
                const username = endpoint.split('/users/')[1].split('/following')[0];
                storage.set(`unified_v2_${prefix}following_${username}`, data);
                
                const users = data.users || data.data?.users || [];
                this.prefetchMediaUrls(users.slice(0, 20).map(u => u.avatar));
            }
            
            else if (endpoint.includes('/notifications')) {
                storage.set(`unified_v2_${prefix}notifications`, data);
            }
            
            else if (endpoint.includes('/hashtags/trending')) {
                storage.set(`unified_v2_${prefix}explore`, data);
            }
        } 
        
        
        else if (endpoint.includes('/posts/user/') && postsFound.length > 0) {
            this.prefetchMediaForPosts(postsFound);
        }
    },

    async getFallback(endpoint) {
        
        const isFirstPage = !endpoint.includes('cursor=') && (!endpoint.includes('offset=') || endpoint.includes('offset=0'));
        if (!isFirstPage) return null;
        
        const prefix = getUserIdPrefix();

        if (endpoint.includes('/posts?')) {
            const tab = new URLSearchParams(endpoint.split('?')[1]).get('tab') || 'popular';
            return await storage.get(`unified_v2_${prefix}feed_${tab}`);
        }
        if (endpoint.includes('/posts/user/')) {
            const username = endpoint.split('/posts/user/')[1].split('?')[0];
            return await storage.get(`unified_v2_${prefix}profile_posts_${username}`);
        }
        
        if (endpoint.includes('/followers')) {
            const username = endpoint.split('/users/')[1].split('/followers')[0];
            return await storage.get(`unified_v2_${prefix}followers_${username}`);
        }
        
        if (endpoint.includes('/following')) {
            const username = endpoint.split('/users/')[1].split('/following')[0];
            return await storage.get(`unified_v2_${prefix}following_${username}`);
        }
        if (endpoint.startsWith('/users/') && !endpoint.includes('/posts/')) {
            const username = endpoint.split('/users/')[1].split('?')[0];
            return await storage.get(`unified_v2_${prefix}profile_info_${username}`);
        }
        if (endpoint.includes('/notifications')) {
            return await storage.get(`unified_v2_${prefix}notifications`);
        }
        if (endpoint.includes('/hashtags/trending')) {
            return await storage.get(`unified_v2_${prefix}explore`);
        }
        return null;
    },

    
    processPosts(posts, prefix) {
        const mediaUrlsToPrefetch = new Set();
        posts.forEach(post => {
            if ((post.likesCount || 0) > 30 || (post.viewsCount || 0) > 1000) {
                storage.set(`unified_v2_${prefix}post_${post.id}`, post);
                this.extractMediaFromPost(post, mediaUrlsToPrefetch);
            }
        });
        this.prefetchMediaUrls(Array.from(mediaUrlsToPrefetch));
    },

    prefetchMediaForPosts(posts) {
        const mediaUrls = new Set();
        posts.forEach(post => this.extractMediaFromPost(post, mediaUrls));
        this.prefetchMediaUrls(Array.from(mediaUrls));
    },

    extractMediaFromPost(post, urlSet) {
        if (!post) return;
        if (post.attachments && Array.isArray(post.attachments)) {
            post.attachments.forEach(att => { if (att.url) urlSet.add(att.url); });
        }
        if (post.author?.avatar && post.author.avatar.startsWith('http')) {
            urlSet.add(post.author.avatar);
        }
        if (post.originalPost) {
            this.extractMediaFromPost(post.originalPost, urlSet);
        }
    },

    prefetchMediaUrls(urls) {
        const validUrls = (urls || []).filter(u => u && typeof u === 'string');
        if (validUrls.length > 0 && window.api?.invoke) {
            window.api.invoke('cache:prefetch', validUrls);
        }
    }
};