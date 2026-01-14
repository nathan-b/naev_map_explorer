const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    screen
} = require('electron');
const path = require('path');
const gx = require("./github.js");
const naev = require("./naev.js");

//
// All the boilerplate required by electron
//

/**
 * Create the UI
 */
function createWindow() {
    // Get primary display dimensions
    const primary_display = screen.getPrimaryDisplay();
    const { width: screen_width, height: screen_height } = primary_display.workAreaSize;

    // Default dimensions
    const default_width = 1200;
    const default_height = 1300;

    // Use default size, but cap at 90% of screen size to ensure it fits
    const window_width = Math.min(default_width, Math.floor(screen_width * 0.9));
    const window_height = Math.min(default_height, Math.floor(screen_height * 0.9));

    const mainwin = new BrowserWindow({
        width: window_width,
        height: window_height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: true,
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainwin.loadFile('index.html');
}

/**
 * Get the main window
 */
function getWindow() {
    if (BrowserWindow.getAllWindows().length === 0) {
        return null;
    }
    return BrowserWindow.getAllWindows()[0];
}

// Message handlers
ipcMain.handle('load_from_path', async (event, naev_path) => {
    // If path is empty, show dialog to select directory
    if (!naev_path || naev_path.trim() === '') {
        const result = dialog.showOpenDialogSync(getWindow(), {
            title: 'Select your Naev data directory (containing spob/ and ssys/ folders)',
            properties: ['openDirectory']
        });
        if (result && result.length > 0) {
            naev_path = result[0];
        } else {
            // User cancelled the dialog
            return null;
        }
    }

    return new Promise((resolve, reject) => {
        try {
            naev.read_systems_from_disk(naev_path, (sys_map) => {
                if (sys_map && Object.keys(sys_map).length > 0) {
                    resolve(JSON.stringify(sys_map));
                } else {
                    reject(new Error('No systems loaded from path'));
                }
            });
        } catch (error) {
            reject(error);
        }
    });
});

ipcMain.handle('load_from_github', async (event) => {
    return new Promise((resolve, reject) => {
        try {
            naev.read_systems_from_github((sys_map) => {
                if (sys_map && Object.keys(sys_map).length > 0) {
                    resolve(JSON.stringify(sys_map));
                } else {
                    reject(new Error('No systems loaded from GitHub'));
                }
            });
        } catch (error) {
            reject(error);
        }
    });
});

ipcMain.handle('get_autodetected_path', async (event) => {
    return naev.get_game_data_dir();
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