import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

const CONFIG_FILE = path.join(app.getPath('userData'), 'roseobase-config.json');

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch { /* ignore corrupt config */ }
  return {};
}

function writeConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

function getBlastBinDir() {
  if (isDev) return '';
  return path.join(process.resourcesPath, 'blast-bin');
}

let mainWindow;
let serverPort;

async function startBackendServer(dataDir) {
  const blastBinDir = getBlastBinDir();
  const serverModule = path.join(__dirname, '..', 'src', 'server', 'index.js');

  const { startServer } = await import(serverModule);
  const port = await startServer({ dataDir, blastBinDir, port: 0 });
  return port;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Roseobase',
  });

  if (isDev) {
    mainWindow.loadURL(`http://localhost:5173`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  const config = readConfig();

  ipcMain.handle('dialog:selectDataDir', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Roseobase Data Directory',
      message: 'Choose the folder containing genomes/ and blastdb/ subdirectories',
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const selected = result.filePaths[0];
      const cfg = readConfig();
      cfg.dataDir = selected;
      writeConfig(cfg);
      return selected;
    }
    return null;
  });

  ipcMain.handle('config:getDataDir', () => {
    return readConfig().dataDir || null;
  });

  ipcMain.handle('config:getServerPort', () => {
    return serverPort;
  });

  ipcMain.handle('server:restart', async (_event, newDataDir) => {
    if (newDataDir) {
      const cfg = readConfig();
      cfg.dataDir = newDataDir;
      writeConfig(cfg);
    }
    const dataDir = newDataDir || readConfig().dataDir || '';
    try {
      serverPort = await startBackendServer(dataDir);
      return { port: serverPort };
    } catch (err) {
      return { error: err.message };
    }
  });

  const dataDir = config.dataDir || '';
  try {
    serverPort = await startBackendServer(dataDir);
  } catch (err) {
    console.error('Failed to start backend server:', err);
  }

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
