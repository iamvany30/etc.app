import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const usePosts = (tab = 'popular') => {
    return useInfiniteQuery({
        
        queryKey: ['posts', tab],
        
        
        queryFn: async ({ pageParam = null }) => {
            
            const res = await apiClient.getPosts(tab, pageParam, 20);
            
            
            if (res.error) {
                throw new Error(res.error.message || 'Ошибка загрузки');
            }
            
            
            
            return res.data || res; 
        },

        
        initialPageParam: null,
        getNextPageParam: (lastPage) => {
            
            if (!lastPage?.pagination?.hasMore) return undefined;
            return lastPage.pagination.nextCursor;
        },
    });
};