const {
    app,
    BrowserWindow,
    ipcMain,
    dialog
} = require('electron');
const path = require('path');
const gx = require("./github.js");
const canvas = require("./canvas.js");
const naev = require("./naev.js");

//
// All the boilerplate required by electron
//

// Create the UI
function createWindow() {
    const mainwin = new BrowserWindow({
        width: 1200,
        height: 1300,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainwin.loadFile('index.html');
    mainwin.webContents.openDevTools();
}

function getWindow() {
    if (BrowserWindow.getAllWindows().length === 0) {
        return null;
    }
    return BrowserWindow.getAllWindows()[0];
}

// Message handlers
ipcMain.handle('load_from_path', async (event, path) => {
    /*[file_path] = dialog.showOpenDialogSync(getWindow(), {
        title: 'Select your Naev directory',
        properties: ['openFile']
    });*/
    return new Promise((resolve, reject) => {
        naev.read_systems_from_disk(path, (sys_map) => {
            resolve(JSON.stringify(sys_map));
        });
    });
});

ipcMain.handle('load_from_github', async (event) => {
    return new Promise((resolve, reject) => {
        naev.read_systems_from_github((sys_map) => {
            resolve(JSON.stringify(sys_map));
        });
    });
});

// Entrypoint
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Exit handler
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})