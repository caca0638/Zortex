/**
 * =============================================================================
 * ZORTEX: CYBER SURVIVOR - NATIVE DESKTOP ENGINE (ELECTRON MAIN PROCESS)
 * =============================================================================
 * High-performance 144Hz+ unlocked WebGL GPU container with atomic save API,
 * hardware gamepad haptics support, and native fullscreen / window management.
 * =============================================================================
 */

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// -----------------------------------------------------------------------------
// 1. GPU & 144Hz+ HIGH-REFRESH HARDWARE ACCELERATION FLAGS
// -----------------------------------------------------------------------------
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('gpu-no-context-lost');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-gamepad-extensions');
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

const APP_ROOT = path.resolve(__dirname, '..');

// -----------------------------------------------------------------------------
// 2. EXTERNAL PERSISTENT PROFILE & ATOMIC SAVE DIRECTORY
// -----------------------------------------------------------------------------
function getExternalProfileDir() {
  const appData = process.env.APPDATA || process.env.LOCALAPPDATA || app.getPath('appData');
  return path.join(appData, 'ZortexCyberSurvivor', '.app_profile');
}

const PROFILE_DIR = getExternalProfileDir();
const SAVE_FILE = path.join(PROFILE_DIR, 'save_data.json');
const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

// Ensure Chromium userData (localStorage, IndexedDB, WebGL Shader Cache) lives in persistent AppData
app.setPath('userData', path.join(PROFILE_DIR, 'EngineCache'));

function ensureProfileDir() {
  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }
}

function isValidSaveSchema(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (!data.profiles || typeof data.profiles !== 'object' || Array.isArray(data.profiles)) return false;
  if ('activeProfile' in data && data.activeProfile !== null && typeof data.activeProfile !== 'string') {
    return false;
  }
  if ('savedAt' in data && typeof data.savedAt !== 'number') return false;
  for (const [k, v] of Object.entries(data.profiles)) {
    if (typeof k !== 'string' || !v || typeof v !== 'object' || Array.isArray(v)) return false;
  }
  return true;
}

function readSaveDataSync() {
  ensureProfileDir();
  if (!fs.existsSync(SAVE_FILE)) return null;
  try {
    const raw = fs.readFileSync(SAVE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function writeSaveDataAtomicSync(data) {
  ensureProfileDir();
  const tmpFile = `${SAVE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, SAVE_FILE);
}

// -----------------------------------------------------------------------------
// 3. EMBEDDED LOOPBACK ENGINE SERVER (ZERO-LATENCY ASSET & SAVE STREAMING)
// -----------------------------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.xml': 'application/xml',
  '.vert': 'text/plain; charset=utf-8',
  '.frag': 'text/plain; charset=utf-8',
  '.glsl': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

let localServer = null;
let serverPort = 0;

function startEmbeddedServer() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
      const cleanPath = decodeURIComponent(parsedUrl.pathname);

      // Block hidden / dot files
      const parts = cleanPath.replace(/\\/g, '/').split('/').filter(Boolean);
      if (parts.some(p => p.startsWith('.'))) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'error', message: 'Not Found' }));
        return;
      }

      // API Endpoints (/api/save & /api/health)
      if (cleanPath === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'ok', server: 'Zortex Native Engine 2.5' }));
        return;
      }

      if (cleanPath === '/api/save') {
        if (req.method === 'GET') {
          const saved = readSaveDataSync();
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          });
          res.end(JSON.stringify({ status: 'ok', data: saved }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          let aborted = false;
          req.on('data', chunk => {
            body += chunk.toString('utf8');
            if (Buffer.byteLength(body, 'utf8') > MAX_BODY_SIZE) {
              aborted = true;
              res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ status: 'error', message: 'Payload Too Large' }));
              req.destroy();
            }
          });
          req.on('end', () => {
            if (aborted) return;
            try {
              const data = JSON.parse(body);
              if (!isValidSaveSchema(data)) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ status: 'error', message: 'Invalid Save Schema' }));
                return;
              }
              writeSaveDataAtomicSync(data);
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ status: 'ok', message: 'Save successful', timestamp: Date.now() / 1000 }));
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
            }
          });
          return;
        }
      }

      // Static Game Files
      const relPath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
      const fullPath = path.resolve(APP_ROOT, relPath);

      // Path traversal protection
      if (!fullPath.startsWith(APP_ROOT)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }

      fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }

        const ext = path.extname(fullPath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': mime,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });

        const stream = fs.createReadStream(fullPath);
        stream.on('error', () => {
          if (!res.headersSent) res.writeHead(500);
          res.end();
        });
        stream.pipe(res);
      });
    });

    srv.listen(0, '127.0.0.1', () => {
      localServer = srv;
      serverPort = srv.address().port;
      resolve(serverPort);
    });

    srv.on('error', err => reject(err));
  });
}

// -----------------------------------------------------------------------------
// 4. NATIVE WINDOW & IPC HANDLERS
// -----------------------------------------------------------------------------
let mainWindow = null;

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

ipcMain.handle('zortex:quit', () => {
  app.quit();
});

ipcMain.handle('zortex:toggle-fullscreen', () => {
  if (!mainWindow) return false;
  const nextState = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(nextState);
  return nextState;
});

ipcMain.handle('zortex:is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

async function createGameWindow() {
  ensureProfileDir();
  Menu.setApplicationMenu(null);

  const port = await startEmbeddedServer();
  const iconPath = path.join(__dirname, 'icons', 'icon.ico');

  mainWindow = new BrowserWindow({
    title: 'ZORTEX: CYBER SURVIVOR',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#02050d',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    fullscreen: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      spellcheck: false,
      webgl: true
    }
  });

  mainWindow.maximize();

  // Keyboard shortcuts for native game feel (F11 / Alt+Enter Fullscreen, Ctrl+Shift+I DevTools)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F11' || (input.alt && input.key === 'Enter')) {
        event.preventDefault();
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      } else if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault();
        mainWindow.webContents.toggleDevTools();
      } else if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
        // Prevent accidental browser-style page reload mid-combat
        event.preventDefault();
      }
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/index.html`);

  if (process.argv.includes('--verify-exe')) {
    setTimeout(async () => {
      try {
        const probe = await mainWindow.webContents.executeJavaScript(`
          (async () => {
            const healthResp = await fetch('/api/health').then(r => r.json());
            const hasNative = Boolean(window.ZortexNative && window.ZortexNative.isDesktopApp);
            const hasPixi = Boolean(typeof PIXI !== 'undefined' && typeof pixiApp !== 'undefined' && pixiApp);
            const state = typeof gameState !== 'undefined' ? gameState : 'UNKNOWN';
            const quitBtn = Boolean(document.getElementById('quitDesktopPauseBtn'));
            return { health: healthResp, hasNative, hasPixi, gameState: state, hasQuitDesktopBtn: quitBtn };
          })()
        `);
        console.log('[ZORTEX_EXE_VERIFY_PASS]', JSON.stringify(probe));
        app.exit(0);
      } catch (err) {
        console.error('[ZORTEX_EXE_VERIFY_FAIL]', err);
        app.exit(1);
      }
    }, 2500);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createGameWindow);

app.on('window-all-closed', () => {
  if (localServer) {
    try {
      localServer.close();
    } catch (e) {}
  }
  app.quit();
});
