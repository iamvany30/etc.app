/* @source src/hooks/usePosts.js */
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { FeedCache } from '../core/FeedCache';

export const usePosts = (tab = 'popular') => {
    return useInfiniteQuery({
        queryKey: ['posts', tab],
        
        queryFn: async ({ pageParam = null }) => {
            const res = await apiClient.getPosts(tab, pageParam, 20);
            
            if (res.error) {
                throw new Error(res.error.message || 'Ошибка загрузки');
            }
            
            const data = res.data || res;

            
            if (!pageParam) {
                FeedCache.set(tab, {
                    posts: data.posts,
                    pagination: data.pagination
                });
            }

            return data; 
        },

        initialData: () => {
            const cached = FeedCache.get(tab);
            if (cached) {
                return {
                    pages: [cached], 
                    pageParams: [null]
                };
            }
            return undefined;
        },

        initialPageParam: null,
        getNextPageParam: (lastPage) => {
            if (!lastPage?.pagination?.hasMore) return undefined;
            return lastPage.pagination.nextCursor;
        },
    });
};