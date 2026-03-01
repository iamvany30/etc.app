
import { create } from 'zustand';

const DATABASE_URL = "https://itdp-865f7-default-rtdb.europe-west1.firebasedatabase.app";
const PRESENCE_URL = `${DATABASE_URL}/presence.json`;
const CACHE_KEY = 'itd_plus_verified_cache';


const loadCache = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsedArray = JSON.parse(cached);
            if (Array.isArray(parsedArray)) {
                return new Set(parsedArray);
            }
        }
    } catch (e) {
        console.error("[ITD+] Cache load error:", e);
    }
    return new Set();
};

export const useItdPlusStore = create((set, get) => ({
    verifiedUsers: loadCache(),
    usersData: {}, 
    isLoaded: false,

    
    fetchVerifiedUsers: async () => {
        try {
            
            const res = await fetch(`${PRESENCE_URL}?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    
                    let idsArray = [];
                    if (Array.isArray(data)) {
                        idsArray = data.filter(Boolean).map(item => item.id || item.username);
                    } else {
                        idsArray = Object.keys(data);
                    }
                    
                    const idsSet = new Set(idsArray);
                    
                    set({ 
                        verifiedUsers: idsSet, 
                        usersData: data,
                        isLoaded: true 
                    });

                    
                    localStorage.setItem(CACHE_KEY, JSON.stringify(idsArray));
                }
            }
        } catch (e) {
            console.error("[ITD+] Failed to fetch presence:", e);
        }
    },

    registerCurrentUser: async (user) => {
        if (!user || !user.id) return;
        
        const { verifiedUsers } = get();
        if (verifiedUsers.has(user.id)) return;

        const payload = {
            id: user.id,
            username: user.username || "",
            displayName: user.displayName || user.username || "",
            avatar: user.avatar || null,
            join_date: Date.now()
        };

        try {
            await fetch(`${DATABASE_URL}/presence/${user.id}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            
            const newArray = Array.from(get().verifiedUsers);
            newArray.push(user.id);
            const newSet = new Set(newArray);
            
            set({ verifiedUsers: newSet });
            localStorage.setItem(CACHE_KEY, JSON.stringify(newArray));

        } catch (e) {
            console.error("[ITD+] Failed to register user:", e);
        }
    },

    isVerified: (userId) => {
        return get().verifiedUsers.has(userId);
    }
}));