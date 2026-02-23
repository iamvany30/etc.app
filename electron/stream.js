/* @source electron/stream.js */
const { net } = require('electron');
const { getMainWindow } = require('./window');
const { API_BASE, USER_AGENT } = require('./config');
const network = require('./network');

const RECONNECT_DELAY_BASE = 2000;
const MAX_RECONNECT_DELAY = 30000;

class StreamManager {
    constructor() {
        this.request = null;
        this.accessToken = null;
        this.isConnected = false;
        this.reconnectTimeout = null;
        this.reconnectAttempts = 0;
        this.isExplicitlyStopped = false;
    }

    init(token) {
        this.accessToken = token;
        this.isExplicitlyStopped = false;
        this.reconnectAttempts = 0;
        this.connect();
    }

    connect() {
        
        if (this.request || this.isExplicitlyStopped || !this.accessToken) return;

        console.log('[Stream] Connecting to SSE...');

        const url = `${API_BASE}/notifications/stream`;

        this.request = net.request({
            method: 'GET',
            url: url,
            useSessionCookies: true
        });

        this.request.setHeader('User-Agent', USER_AGENT);
        this.request.setHeader('Accept', 'text/event-stream');
        this.request.setHeader('Authorization', `Bearer ${this.accessToken}`);
        this.request.setHeader('Cache-Control', 'no-cache');
        this.request.setHeader('Connection', 'keep-alive');

        this.request.on('response', (response) => {
            if (response.statusCode === 200) {
                console.log('[Stream] Connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.sendToWindow('stream:status', { status: 'connected' });

                response.on('data', (chunk) => {
                    this.handleData(chunk);
                });

                response.on('end', () => {
                    console.log('[Stream] Connection ended by server');
                    this.cleanupAndReconnect();
                });

                response.on('error', () => {
                    
                });
            } else if (response.statusCode === 401) {
                console.log('[Stream] 401 Unauthorized. Trying to refresh token...');
                this.cleanup();
                this.handleAuthError();
            } else {
                console.warn(`[Stream] Server returned ${response.statusCode}`);
                this.cleanupAndReconnect();
            }
        });

        this.request.on('error', (err) => {
            console.error('[Stream] Request error:', err.message);
            this.cleanupAndReconnect();
        });

        
        this.request.end();
    }

    handleData(chunk) {
        const text = chunk.toString('utf-8');
        
        
        
        const lines = text.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
                try {
                    const jsonStr = trimmed.substring(5).trim();
                    if (!jsonStr) continue;

                    const message = JSON.parse(jsonStr);
                    
                    
                    if (message.type === 'ping' || message === 'ping') return;

                    console.log('[Stream] Notification received:', message.type);
                    
                    
                    this.sendToWindow('notification', message); 

                } catch (e) {
                    console.error('[Stream] Parse error:', e);
                }
            }
        }
    }

    async handleAuthError() {
        const result = await network.refreshSession();
        if (result.success) {
            
            const newToken = network.getGlobalAccessToken();
            if (newToken) {
                this.accessToken = newToken;
                this.connect();
            }
        } else {
            console.error('[Stream] Token refresh failed. Stopping stream.');
            this.stop();
        }
    }

    cleanupAndReconnect() {
        this.cleanup();
        
        if (this.isExplicitlyStopped) return;

        const delay = Math.min(
            RECONNECT_DELAY_BASE * Math.pow(1.5, this.reconnectAttempts),
            MAX_RECONNECT_DELAY
        );

        console.log(`[Stream] Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts + 1})`);
        
        this.sendToWindow('stream:status', { status: 'reconnecting' });

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }

    cleanup() {
        this.isConnected = false;
        if (this.request) {
            try { this.request.abort(); } catch(e){}
            this.request = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    stop() {
        this.isExplicitlyStopped = true;
        this.cleanup();
        console.log('[Stream] Stopped manually');
    }

    updateToken(token) {
        this.accessToken = token;
        this.cleanup(); 
        this.connect(); 
    }

    sendToWindow(channel, data) {
        const win = getMainWindow();
        if (win && !win.isDestroyed()) {
            win.webContents.send(channel, data);
        }
    }
}

module.exports = new StreamManager();