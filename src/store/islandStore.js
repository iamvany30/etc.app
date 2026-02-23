/* @source src/store/islandStore.js */
import { create } from 'zustand';

export const useIslandStore = create((set, get) => ({
    alert: null,
    customColor: null,
    siteActivity: null,
    timeoutId: null,

    showIslandAlert: (type, message, icon, duration = 4000) => {
        const { timeoutId } = get();
        if (timeoutId) clearTimeout(timeoutId);

        set({ alert: { type, message, icon } });

        const newTimeoutId = setTimeout(() => {
            set({ alert: null, timeoutId: null });
        }, duration);

        set({ timeoutId: newTimeoutId });
    },

    setIslandTheme: (color) => set({ customColor: color }),
    setSiteActivity: (activity) => set({ siteActivity: activity })
}));