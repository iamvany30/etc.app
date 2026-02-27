/* @source src/utils/storage.js */
const DB_NAME = 'itd_app_database';
const STORE_NAME = 'keyval_store';
const DB_VERSION = 1;

let dbInstance = null;
let dbPromise = null;

const openDB = () => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            dbInstance.onclose = () => { dbPromise = null; dbInstance = null; };
            dbInstance.onversionchange = () => { 
                dbInstance.close(); 
                dbPromise = null; 
                dbInstance = null; 
            };
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            dbPromise = null;
            reject(event.target.error);
        };
    });

    return dbPromise;
};

const withDB = async (operation) => {
    try {
        const db = await openDB();
        return await operation(db);
    } catch (e) {
        if (e.name === 'InvalidStateError' || (e.message && e.message.includes('closing'))) {
            dbPromise = null; 
            const db = await openDB(); 
            return await operation(db);
        }
        throw e;
    }
};

export const storage = {
    async get(key) {
        try {
            return await withDB(db => new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const request = tx.objectStore(STORE_NAME).get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            }));
        } catch (e) { return null; }
    },

    async set(key, value) {
        try {
            await withDB(db => new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const request = tx.objectStore(STORE_NAME).put(value, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(request.error);
            }));
        } catch (e) {}
    },

    async remove(key) {
        try {
            await withDB(db => new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const request = tx.objectStore(STORE_NAME).delete(key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(request.error);
            }));
        } catch (e) {}
    },

    async clearPrefix(prefix) {
        try {
            await withDB(db => new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.openCursor();
                
                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
                            cursor.delete();
                        }
                        cursor.continue();
                    }
                };
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            }));
        } catch (e) {
            console.error('[Storage] clearPrefix error:', e);
        }
    },

    
    async estimateSizes(prefixesObj) {
        const results = {};
        for (const key in prefixesObj) results[key] = 0;
        results['other'] = 0;

        try {
            await withDB(db => new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.openCursor();

                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const key = cursor.key;
                        const val = cursor.value;
                        
                        let size = 0;
                        if (typeof val === 'string') size = val.length * 2;
                        else size = JSON.stringify(val).length * 2;

                        let matched = false;
                        for (const [id, prefix] of Object.entries(prefixesObj)) {
                            if (key.startsWith(prefix)) {
                                results[id] += size;
                                matched = true;
                                break;
                            }
                        }
                        if (!matched) results['other'] += size;
                        cursor.continue();
                    }
                };
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject();
            }));
        } catch (e) {}
        
        return results;
    }
};