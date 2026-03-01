const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// --- Data paths ---
const userDataPath = app.getPath('userData');
const CONFIG_FILE = path.join(userDataPath, 'config.json');
const HISTORY_FILE = path.join(userDataPath, 'history.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0a0f1e',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'win32',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'public', 'icon.png'),
    show: false,
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC Handlers ---

// Config
ipcMain.handle('config:load', () => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    api_key: '',
    min_reviews: 5,
    min_rating: 3.5,
    max_results: 20,
    auto_save: true,
    save_location: path.join(app.getPath('documents'), 'LeadSeer', 'leads'),
  };
});

ipcMain.handle('config:save', (_, config) => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    return false;
  }
});

// History
ipcMain.handle('history:load', () => {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (e) {}
  return { searches: [], api_calls: 0, total_prospects: 0 };
});

ipcMain.handle('history:save', (_, history) => {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    return true;
  } catch (e) {
    return false;
  }
});

// File operations
ipcMain.handle('file:save-csv', async (_, { defaultName, csvContent }) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
  });
  if (canceled || !filePath) return { success: false };
  try {
    fs.writeFileSync(filePath, csvContent, 'utf8');
    return { success: true, filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('file:auto-save-csv', (_, { dir, filename, csvContent }) => {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, csvContent, 'utf8');
    return { success: true, filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('shell:open-path', (_, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('dialog:pick-folder', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
  });
  if (canceled || !filePaths.length) return null;
  return filePaths[0];
});
