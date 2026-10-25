const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

async function promptDesktopShortcut() {
  if (process.platform !== 'win32') return;

  const flagPath = path.join(app.getPath('userData'), '.shortcut-prompted');
  if (fs.existsSync(flagPath)) return;

  const response = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Create Desktop Shortcut', 'No Thanks, Just Open'],
    defaultId: 0,
    title: 'Tome Setup',
    message: 'Would you like to create a desktop shortcut for quick access?',
  });

  if (response.response === 0) {
    const desktopPath = app.getPath('desktop');
    const shortcutTarget = path.join(desktopPath, 'Tome.lnk');
    shell.writeShortcutLink(shortcutTarget, {
      target: process.execPath,
      description: 'Tome — Offline Multimedia Library',
    });
  }

  fs.writeFileSync(flagPath, 'done');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'Tome',
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // In production load the static build file
    const indexPath = fs.existsSync(path.join(__dirname, 'index.html'))
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, '../dist-desktop/index.html');

  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL('http://localhost:8080');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    promptDesktopShortcut();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
