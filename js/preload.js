const {
    contextBridge,
    ipcRenderer
} = require('electron');

// Set up APIs for sandboxed environment
contextBridge.exposeInMainWorld('ipc_bridge', {
    load_from_path: (file_path, callback) => {
        ipcRenderer.invoke('load_from_path', file_path).then((result) => {
            callback(result);
        });
    },
    load_from_github: (callback) => {
        ipcRenderer.invoke('load_from_github').then((result) => {
            callback(result);
        });
    }
});