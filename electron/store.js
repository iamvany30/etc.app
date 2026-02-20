const fs = require('fs');
const path = require('path');
const { safeStorage, app } = require('electron');
const { PATHS } = require('./config');

let storeData = null;




const useEncryption = false; 

function loadFromDisk() {
    if (!fs.existsSync(PATHS.STORE)) {
        return { activeId: null, accounts: {} };
    }

    try {
        const fileBuffer = fs.readFileSync(PATHS.STORE);
        if (fileBuffer.length === 0) {
            return { activeId: null, accounts: {} };
        }
        
        let decryptedStr;

        
        
        const isLikelyEncrypted = fileBuffer.slice(0, 3).toString() === 'v10';
        
        if (isLikelyEncrypted && safeStorage.isEncryptionAvailable()) {
            try {
                decryptedStr = safeStorage.decryptString(fileBuffer);
            } catch (e) {
                console.error("[Store] Decryption failed:", e.message);
                throw new Error("Decryption failed"); 
            }
        } else {
            
            decryptedStr = fileBuffer.toString('utf8');
        }
        
        const parsed = JSON.parse(decryptedStr);
        return parsed.accounts ? parsed : { activeId: null, accounts: {} };

    } catch (error) {
        console.error(`[Store] Load error: ${error.message}. Resetting store.`);
        
        
        try {
            if (fs.existsSync(PATHS.STORE)) {
                fs.unlinkSync(PATHS.STORE);
            }
        } catch (unlinkErr) {
            console.error("[Store] Failed to unlink:", unlinkErr);
        }
        
        return { activeId: null, accounts: {} };
    }
}

function saveToDisk() {
    if (!storeData) return;

    try {
        const strData = JSON.stringify(storeData);
        let bufferToWrite;

        
        
        if (useEncryption && safeStorage.isEncryptionAvailable()) {
            bufferToWrite = safeStorage.encryptString(strData);
        } else {
            bufferToWrite = Buffer.from(strData, 'utf8');
        }
        
        fs.writeFileSync(PATHS.STORE, bufferToWrite);
        
    } catch (e) { 
        console.error("[Store] Save error:", e); 
    }
}


storeData = loadFromDisk();

function getActiveAccount() {
    if (!storeData.activeId || !storeData.accounts[storeData.activeId]) return null;
    return storeData.accounts[storeData.activeId];
}

function getAccountsList() {
    if (!storeData || !storeData.accounts) return [];
    return Object.values(storeData.accounts).map(acc => ({
        id: acc.user.id,
        username: acc.user.username,
        displayName: acc.user.displayName,
        avatar: acc.user.avatar,
        isActive: acc.user.id === storeData.activeId
    }));
}

function addAccount(userProfile, sessionData) {
    if (!userProfile?.id) return;
    
    if (!storeData.accounts) storeData.accounts = {};

    storeData.accounts[userProfile.id] = { 
        user: userProfile, 
        session: sessionData,
        lastUpdated: Date.now()
    };
    storeData.activeId = userProfile.id;
    saveToDisk();
}

function setActiveId(userId) {
    if (storeData.accounts[userId]) {
        storeData.activeId = userId;
        saveToDisk();
    }
}

function removeAccount(userId) {
    if (storeData.accounts[userId]) {
        delete storeData.accounts[userId];
        if (storeData.activeId === userId) {
            const ids = Object.keys(storeData.accounts);
            storeData.activeId = ids.length > 0 ? ids[0] : null;
        }
        saveToDisk();
    }
}

function updateActiveSessionCookies(cookies) {
    const acc = getActiveAccount();
    if (acc) {
        acc.session.cookies = cookies;
        acc.lastUpdated = Date.now();
        saveToDisk();
    }
}

module.exports = {
    loadSessionData: () => getActiveAccount()?.session,
    clearRefreshToken: () => console.log("[Store] Token invalid/expired."),
    getActiveAccount,
    getAccountsList,
    addAccount,
    setActiveId,
    removeAccount,
    getAccountById: (id) => storeData.accounts[id],
    updateActiveSessionCookies
};