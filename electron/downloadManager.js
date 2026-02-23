/* @source electron/downloadManager.js */
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const activeDownloads = new Map();

module.exports = {
    items: activeDownloads,

    handleWillDownload: (event, item, webContents) => {
        
        const id = crypto.randomUUID();
        
        
        item.pause();
        
        activeDownloads.set(id, item);

        const fileName = item.getFilename();
        const url = item.getURL();
        const startTime = Date.now();
        
        const downloadsPath = app.getPath('downloads');
        const saveDir = path.join(downloadsPath, 'etc.app');
        if (!fs.existsSync(saveDir)) {
            try { fs.mkdirSync(saveDir, { recursive: true }); } catch(e) {}
        }
        const fullPath = path.join(saveDir, fileName);
        item.setSavePath(fullPath);

        let lastReceived = 0;
        let lastTime = Date.now();
        let speed = 0; 

        const sendUpdate = (status, percent = 0, received = 0, total = 0, currentSpeed = 0) => {
            if (!webContents.isDestroyed()) {
                webContents.send('download-progress', { 
                    id, 
                    url, 
                    fileName, 
                    path: fullPath, 
                    percent, 
                    status,
                    startTime,
                    receivedBytes: received,
                    totalBytes: total,
                    speed: currentSpeed
                });
            }
        };

        
        sendUpdate('paused', 0, 0, item.getTotalBytes(), 0);

        item.on('updated', (event, state) => {
            const now = Date.now();
            const received = item.getReceivedBytes();
            const total = item.getTotalBytes();

            
            if (now - lastTime > 500) {
                speed = ((received - lastReceived) / (now - lastTime)) * 1000;
                lastReceived = received;
                lastTime = now;
            }

            if (state === 'interrupted') {
                sendUpdate('interrupted', 0, received, total, 0);
            } else if (state === 'progressing') {
                let percent = -1; 
                if (total > 0) {
                    percent = (received / total) * 100;
                }

                if (item.isPaused()) {
                    sendUpdate('paused', percent, received, total, 0);
                } else {
                    sendUpdate('progressing', percent, received, total, speed);
                }
            }
        });

        item.on('done', (event, state) => {
            activeDownloads.delete(id); 
            const status = state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'failed';
            sendUpdate(status, 100, item.getReceivedBytes(), item.getTotalBytes(), 0);
        });
    },

    resumeDownload: (id) => {
        const item = activeDownloads.get(id);
        if (item) {
            if (item.isPaused()) item.resume();
        }
    },

    cancelDownload: (id) => {
        const item = activeDownloads.get(id);
        if (item) {
            item.cancel();
            activeDownloads.delete(id);
        }
    }
};