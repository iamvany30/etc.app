/* @source electron/store.js */
const fs = require('fs');
const { safeStorage } = require('electron');
const Database = require('better-sqlite3');
const { PATHS } = require('./config');


const db = new Database(PATHS.STORE_DB);


db.pragma('journal_mode = WAL');


db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_data TEXT NOT NULL,
    session_data BLOB NOT NULL, -- Используем BLOB для зашифрованных данных
    last_updated INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);


const queries = {
  getAccount: db.prepare('SELECT * FROM accounts WHERE id = ?'),
  getAccounts: db.prepare('SELECT id, user_data FROM accounts'),
  insertAccount: db.prepare('INSERT OR REPLACE INTO accounts (id, user_data, session_data, last_updated) VALUES (@id, @user_data, @session_data, @last_updated)'),
  deleteAccount: db.prepare('DELETE FROM accounts WHERE id = ?'),
  updateSession: db.prepare('UPDATE accounts SET session_data = ?, last_updated = ? WHERE id = ?'),
  getActiveId: db.prepare("SELECT value FROM app_state WHERE key = 'activeAccountId'"),
  setActiveId: db.prepare("INSERT OR REPLACE INTO app_state (key, value) VALUES ('activeAccountId', ?)"),
};


const runMigration = () => {
    if (!fs.existsSync(PATHS.STORE_LEGACY_JSON)) {
        return; 
    }
    
    console.log('[Store] Обнаружен старый файл session.secure. Запуск миграции в SQLite...');

    try {
        const fileBuffer = fs.readFileSync(PATHS.STORE_LEGACY_JSON);
        if (fileBuffer.length === 0) throw new Error("Legacy file is empty");

        let decryptedStr;
        try {
            decryptedStr = safeStorage.decryptString(fileBuffer);
        } catch (e) {
            decryptedStr = fileBuffer.toString('utf8');
        }
        
        const data = JSON.parse(decryptedStr);
        if (!data || !data.accounts) throw new Error("Invalid legacy data structure");

        
        const migrateTransaction = db.transaction(() => {
            for (const accountId in data.accounts) {
                const account = data.accounts[accountId];
                if (!account.user || !account.session) continue;
                
                queries.insertAccount.run({
                    id: account.user.id,
                    user_data: JSON.stringify(account.user),
                    session_data: safeStorage.encryptString(JSON.stringify(account.session)),
                    last_updated: account.lastUpdated || Date.now()
                });
            }
            if (data.activeId) {
                queries.setActiveId.run(data.activeId);
            }
        });

        migrateTransaction();
        
        
        fs.renameSync(PATHS.STORE_LEGACY_JSON, PATHS.STORE_LEGACY_JSON + '.migrated');
        console.log('[Store] Миграция успешно завершена. Старый файл переименован.');

    } catch (error) {
        console.error(`[Store] Ошибка миграции: ${error.message}. Старый файл будет сохранен как .bak`);
        try {
            fs.renameSync(PATHS.STORE_LEGACY_JSON, PATHS.STORE_LEGACY_JSON + '.bak');
        } catch (renameErr) {
            console.error("[Store] Не удалось переименовать поврежденный файл:", renameErr);
        }
    }
};

runMigration();


function getActiveId() {
    return queries.getActiveId.get()?.value || null;
}

function getAccountById(id) {
    if (!id) return null;
    const row = queries.getAccount.get(id);
    if (!row) return null;
    
    try {
        return {
            user: JSON.parse(row.user_data),
            session: JSON.parse(safeStorage.decryptString(row.session_data)),
            lastUpdated: row.last_updated
        };
    } catch (e) {
        console.error(`[Store] Не удалось расшифровать данные для аккаунта ${id}:`, e);
        return null;
    }
}

function getActiveAccount() {
    const activeId = getActiveId();
    return getAccountById(activeId);
}

function getAccountsList() {
    const activeId = getActiveId();
    const rows = queries.getAccounts.all();
    return rows.map(row => {
        const user = JSON.parse(row.user_data);
        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            isActive: user.id === activeId
        };
    });
}

function addAccount(userProfile, sessionData) {
    if (!userProfile?.id) return;
    
    queries.insertAccount.run({
        id: userProfile.id,
        user_data: JSON.stringify(userProfile),
        session_data: safeStorage.encryptString(JSON.stringify(sessionData)),
        last_updated: Date.now()
    });
    
    queries.setActiveId.run(userProfile.id);
}

function setActiveId(userId) {
    queries.setActiveId.run(userId);
}

function removeAccount(userId) {
    const currentActiveId = getActiveId();
    queries.deleteAccount.run(userId);

    if (currentActiveId === userId) {
        const remainingAccounts = queries.getAccounts.all();
        const newActiveId = remainingAccounts.length > 0 ? remainingAccounts[0].id : null;
        if (newActiveId) {
            queries.setActiveId.run(newActiveId);
        } else {
             
            db.prepare("DELETE FROM app_state WHERE key = 'activeAccountId'").run();
        }
    }
}

function updateActiveSessionCookies(cookies) {
    const activeId = getActiveId();
    if (!activeId) return;

    const account = getAccountById(activeId);
    if (account) {
        account.session.cookies = cookies;
        const newSessionData = safeStorage.encryptString(JSON.stringify(account.session));
        queries.updateSession.run(newSessionData, Date.now(), activeId);
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
    getAccountById,
    updateActiveSessionCookies
};