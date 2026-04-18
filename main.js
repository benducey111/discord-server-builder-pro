const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { testConnection, deployServer, sendWebhook } = require('./deploy/discord-deploy');

let mainWindow;
let splashWindow;
let isMaximized = false;

function createWindow() {
  // ── Splash window ──────────────────────────────────────────────────────
  splashWindow = new BrowserWindow({
    width:           400,
    height:          300,
    frame:           false,
    resizable:       false,
    transparent:     false,
    backgroundColor: '#08090f',
    center:          true,
    skipTaskbar:     true,
    webPreferences:  { contextIsolation: true, nodeIntegration: false }
  });
  splashWindow.loadFile(path.join(__dirname, 'renderer', 'splash.html'));

  // ── Main window (hidden until ready) ──────────────────────────────────
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    transparent: false,
    backgroundColor: '#0d0e14',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'landing.html'));

  // Show main window after 2 seconds (or when ready-to-show, whichever is later)
  let splashDismissed = false;
  function dismissSplash() {
    if (splashDismissed) return;
    splashDismissed = true;
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
  }

  mainWindow.once('ready-to-show', () => {
    // Wait at minimum 2 seconds so the splash animation completes
    setTimeout(dismissSplash, 2000);
  });

  mainWindow.on('maximize', () => {
    isMaximized = true;
    mainWindow.webContents.send('window-state-changed', { maximized: true });
  });

  mainWindow.on('unmaximize', () => {
    isMaximized = false;
    mainWindow.webContents.send('window-state-changed', { maximized: false });
  });
}

// Window controls
ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.handle('window-close', () => mainWindow.close());

// Open URL in system browser (used for Stripe Checkout)
ipcMain.handle('open-external', (event, url) => shell.openExternal(url));

// Project save
ipcMain.handle('save-project', async (event, { data, suggestedName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Project',
    defaultPath: suggestedName || 'my-server.dsbp',
    filters: [
      { name: 'Discord Builder Project', extensions: ['dsbp'] },
      { name: 'JSON', extensions: ['json'] }
    ]
  });
  if (result.canceled || !result.filePath) return { success: false };
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Quick save (to known path)
ipcMain.handle('quick-save', async (event, { data, filePath }) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Project load
ipcMain.handle('load-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Load Project',
    filters: [
      { name: 'Discord Builder Project', extensions: ['dsbp', 'json'] }
    ],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return { success: false };
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf8');
    const data = JSON.parse(raw);
    return { success: true, data, filePath: result.filePaths[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Export JSON
ipcMain.handle('export-json', async (event, { data, suggestedName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export as JSON',
    defaultPath: suggestedName || 'server-export.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { success: false };
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Export TXT
ipcMain.handle('export-txt', async (event, { content, suggestedName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Messages as TXT',
    defaultPath: suggestedName || 'server-messages.txt',
    filters: [{ name: 'Text File', extensions: ['txt'] }]
  });
  if (result.canceled || !result.filePath) return { success: false };
  try {
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Reveal file in explorer
ipcMain.handle('reveal-file', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
  }
});

// ── Discord Deploy: Test Connection ────────────────────────────────────────
ipcMain.handle('deploy-test-connection', async (event, { token, guildId }) => {
  try {
    const { bot, guild } = await testConnection(token, guildId);
    return {
      success: true,
      botName: `${bot.username}${bot.discriminator && bot.discriminator !== '0' ? '#' + bot.discriminator : ''}`,
      botId: bot.id,
      guildName: guild.name,
      guildId: guild.id
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── Discord Deploy: Deploy Server ──────────────────────────────────────────
ipcMain.handle('deploy-to-server', async (event, { token, guildId, project, options }) => {
  try {
    const onProgress = (message, level = 'info') => {
      mainWindow.webContents.send('deploy-progress', { message, level });
    };
    const summary = await deployServer(token, guildId, project, options, onProgress);
    return { success: true, summary };
  } catch (err) {
    mainWindow.webContents.send('deploy-progress', {
      message: `❌ Fatal error: ${err.message}`,
      level: 'error'
    });
    return { success: false, error: err.message };
  }
});

// ── Feature 5: Webhook Sender ──────────────────────────────────────────────
ipcMain.handle('send-webhook', async (event, { webhookUrl, messageData }) => {
  try {
    await sendWebhook(webhookUrl, messageData);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── Feature 4: Import Template ─────────────────────────────────────────────
ipcMain.handle('import-template', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Template',
    filters: [
      { name: 'Discord Builder Template', extensions: ['dsbpt', 'json'] }
    ],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return { success: false };
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf8');
    const data = JSON.parse(raw);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
