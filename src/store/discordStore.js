/* @source src/store/discordStore.js */
import { create } from 'zustand';

export const useDiscordStore = create((set) => ({
    currentActivity: null, 

    setActivity: (type, details) => set({ currentActivity: { type, details } }),
    clearActivity: () => set({ currentActivity: null })
}));