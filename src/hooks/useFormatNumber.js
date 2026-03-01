import { useCallback } from 'react';
import { useAppearanceStore } from '../store/appearanceStore';

export const useFormatNumber = () => {
    const useFullNumbers = useAppearanceStore(state => state.useFullNumbers);

    return useCallback((num) => {
        if (!num && num !== 0) return '0';
        
        if (useFullNumbers) {
            return new Intl.NumberFormat('ru-RU').format(num);
        }

        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }, [useFullNumbers]);
};