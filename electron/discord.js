const DiscordRPC = require('discord-rpc');
const { getMainWindow } = require('./window');


const clientId = '1473988630258258093'; 

let rpc;
let isReady = false;
let isConnecting = false;
const retryDelay = 15000;

const connect = () => {
    if (rpc || isConnecting) return;

    isConnecting = true;
    console.log('[Discord RPC] Attempting to connect...');

    const newRpc = new DiscordRPC.Client({ transport: 'ipc' });

    const cleanupAndRetry = () => {
        if (rpc === newRpc) { 
            rpc.removeAllListeners(); 
            rpc.destroy().catch(() => {}); 
            rpc = null;
        }
        isReady = false;
        isConnecting = false;
        setTimeout(connect, retryDelay);
    };

    newRpc.on('ready', () => {
        console.log(`[Discord RPC] Ready for user: ${newRpc.user.username}`);
        isReady = true;
        isConnecting = false;
        rpc = newRpc; 

        const win = getMainWindow();
        if (win && !win.isDestroyed()) {
            win.webContents.send('discord-connected', {
                username: newRpc.user.username,
                discriminator: newRpc.user.discriminator,
                avatar: newRpc.user.avatar
            });
        }
    });
    
    newRpc.on('disconnected', () => {
        console.error('[Discord RPC] Disconnected. Will try to reconnect...');
        cleanupAndRetry();
    });

    newRpc.login({ clientId }).catch(err => {
        console.error(`[Discord RPC] Login failed: ${err.message}. Retrying in ${retryDelay / 1000}s.`);
        
        
        rpc = null;
        isReady = false;
        isConnecting = false;
        setTimeout(connect, retryDelay);
    });
};

const setActivity = async (data) => {
    if (!rpc || !isReady) return;
    try {
        await rpc.setActivity({ instance: false, ...data });
    } catch (e) {
        console.error('[Discord RPC] Failed to set activity', e);
    }
};

const clearActivity = () => {
    if (!rpc || !isReady) return;
    try {
        rpc.clearActivity();
    } catch (e) {
        console.error('[Discord RPC] Failed to clear activity', e);
    }
};

module.exports = { 
    init: connect,
    setActivity, 
    clearActivity 
};