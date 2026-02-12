const { getMainWindow } = require('./window');

function logDebug(message, data = null) {
    const ts = new Date().toLocaleTimeString();
    const msg = `[AUTH-DEBUG] ${ts} | ${message}`;
    console.log(msg);
    if (data) console.log(JSON.stringify(data, null, 2));
    
     
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
        win.webContents.send('auth-log', message);
    }
}

module.exports = { logDebug };