/* @source src/store/modalStore.js */
import { create } from 'zustand';

export const useModalStore = create((set) => ({
    isOpen: false,
    content: null,
    variant: 'glass', 

    openModal: (content, options = {}) => set({
        isOpen: true,
        content,
        variant: options.variant || 'glass'
    }),

    closeModal: () => {
        
        
        
        set({ isOpen: false });
        
        
        setTimeout(() => {
            set((state) => {
                
                if (!state.isOpen) {
                    return { content: null, variant: 'glass' };
                }
                return {};
            });
        }, 300);
    }
}));