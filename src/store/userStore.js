/* @source src/store/userStore.js */
import { create } from 'zustand';
import { FeedCache } from '../core/FeedCache';

export const useUserStore = create((set, get) => ({
    currentUser: null,
    accounts: [],
    switchingTarget: null,
    isOverlayExiting: false,

    setCurrentUser: (updater) => {
        set((state) => {
            const newUser = typeof updater === 'function' 
                ? updater(state.currentUser) 
                : updater;

            if (newUser) {
                const safeUser = { ...newUser };
                delete safeUser.accessToken;
                delete safeUser.refreshToken;
                localStorage.setItem('nowkie_user', JSON.stringify(safeUser));
            } else {
                localStorage.removeItem('nowkie_user');
            }

            return { currentUser: newUser };
        });
    },

    refreshAccountsList: async () => {
        if (window.api) {
            try {
                const list = await window.api.invoke('auth:get-accounts');
                if (Array.isArray(list)) set({ accounts: list });
            } catch (e) {}
        }
    },

    switchAccount: async (userId) => {
        const state = get();
        if (userId === state.currentUser?.id || !window.api) return;
        
        const targetAccount = state.accounts.find(acc => acc.id === userId);
        if (!targetAccount) return;

        set({ isOverlayExiting: false, switchingTarget: targetAccount });

        try {
            const startTime = Date.now();
            
            const switchResult = await window.api.invoke('auth:switch-account', userId);
            
            if (!switchResult.success) {
                console.error("[UserStore] Ошибка переключения:", switchResult.error);
                
                if (switchResult.error === 'TOKEN_DEAD') {
                    console.log(`[UserStore] Токен аккаунта ${targetAccount.username} мертв. Удаляем и ищем следующий...`);
                    
                    await window.api.invoke('auth:remove-account', userId);
                    
                    const remainingAccounts = state.accounts.filter(a => a.id !== userId);
                    set({ accounts: remainingAccounts });
                    
                    set({ switchingTarget: null });

                    if (remainingAccounts.length > 0) {
                        return state.switchAccount(remainingAccounts[0].id);
                    } else {
                        state.setCurrentUser(null);
                        window.location.reload();
                        return;
                    }
                }
                
                throw new Error(switchResult.error);
            }

            FeedCache.clear();
            
            const newUserProfile = await window.api.invoke('get-init-user');
            if (!newUserProfile || newUserProfile.error) {
                console.error("[UserStore] Не удалось получить профиль. Пробуем следующий...");
                
                await window.api.invoke('auth:remove-account', userId);
                const remainingAccounts = state.accounts.filter(a => a.id !== userId);
                set({ accounts: remainingAccounts, switchingTarget: null });

                if (remainingAccounts.length > 0) {
                    return state.switchAccount(remainingAccounts[0].id);
                } else {
                    state.setCurrentUser(null);
                    window.location.reload();
                    return;
                }
            }

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 1200 - elapsed);
            if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

            state.setCurrentUser(newUserProfile);
            state.refreshAccountsList();
            setTimeout(() => {
                set({ isOverlayExiting: true });
                setTimeout(() => {
                    set({ switchingTarget: null, isOverlayExiting: false });
                }, 500);
            }, 50);

        } catch (e) {
            console.error("[UserStore] Критическая ошибка переключения:", e);
            set({ switchingTarget: null });
            state.refreshAccountsList();
        }
    },

    logoutAccount: async (userId) => {
        if (!window.api) return;
        const state = get();
        
        try {
            await window.api.invoke('auth:remove-account', userId);
            
            const updatedAccounts = state.accounts.filter(acc => acc.id !== userId);
            set({ accounts: updatedAccounts });

            if (userId === state.currentUser?.id) {
                if (updatedAccounts.length > 0) {
                    console.log("[UserStore] Выход из текущего аккаунта. Переключение на следующий...");
                    state.switchAccount(updatedAccounts[0].id);
                } else {
                    console.log("[UserStore] Аккаунтов больше нет. Полный выход.");
                    localStorage.removeItem('nowkie_user');
                    state.setCurrentUser(null);
                    window.location.reload(); 
                }
            } else {
                state.refreshAccountsList();
            }
        } catch (e) {
            console.error("[UserStore] Ошибка выхода:", e);
        }
    }
}));