import { app, BrowserWindow, ipcMain, session, clipboard, Tray, Menu, nativeImage } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
import * as fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;
let qwenLoginWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const store = new Store({
  defaults: {
    uiState: {
      theme: 'dark',
      sidebarPosition: 'left',
    }
  }
});

/**
 * Create main application window
 */
function createWindow() {
  // Determine icon path based on platform
  let iconPath: string;
  if (process.platform === 'win32') {
    iconPath = path.join(__dirname, '../assets/icons/win/icon.ico');
  } else if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, '../assets/icons/mac/icon.icns');
  } else {
    iconPath = path.join(__dirname, '../assets/icons/png/512x512.png');
  }

  mainWindow = new BrowserWindow({
    width: 900,
    height: 660,
    minWidth: 700,
    minHeight: 550,
    frame: false, // Remove native title bar to use custom TitleBar component
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In development, load from Vite dev server
  // In production, load from build
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Load production build
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  // Prevent window close unless app is quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      console.log('[Window] Window hidden to tray');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Send maximize/unmaximize events to renderer
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:unmaximized');
  });
}

/**
 * Create system tray icon
 */
function createTray() {
  // Platform-specific icon path (use appropriate size for tray)
  let iconPath: string;
  if (process.platform === 'darwin') {
    // macOS prefers 16x16 for tray icons
    iconPath = path.join(__dirname, '../assets/icons/png/16x16.png');
  } else if (process.platform === 'win32') {
    // Windows prefers ICO format for tray
    iconPath = path.join(__dirname, '../assets/icons/win/icon.ico');
  } else {
    // Linux typically uses 32x32 or 48x48
    iconPath = path.join(__dirname, '../assets/icons/png/32x32.png');
  }

  // Create tray icon
  tray = new Tray(iconPath);

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  // Set tooltip and context menu
  tray.setToolTip('Qwen Proxy POC');
  tray.setContextMenu(contextMenu);

  // Click to toggle window visibility
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  console.log('[Tray] System tray created');
}

/**
 * IPC Handler: Open Qwen login window
 * Based on doc 48 - Main Process - Opening Login Window
 * Uses simple navigation-based detection instead of DOM injection
 */
ipcMain.handle('qwen:open-login', async () => {
  console.log('[Qwen Login] ⭐ qwen:open-login IPC handler called!');
  return new Promise<void>((resolve, reject) => {
    console.log('[Qwen Login] Opening login window...');

    // Create login window
    qwenLoginWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    qwenLoginWindow.loadURL('https://chat.qwen.ai');

    console.log('[Qwen Login] Window created, setting up event listeners...');

    // Listen for ALL navigation events to debug
    qwenLoginWindow.webContents.on('did-navigate', async (event, url) => {
      console.log('[Qwen Login] ========================================');
      console.log('[Qwen Login] did-navigate event fired!');
      console.log('[Qwen Login] URL:', url);
      console.log('[Qwen Login] Includes chat.qwen.ai?', url.includes('chat.qwen.ai'));
      console.log('[Qwen Login] Includes /login?', url.includes('/login'));
      console.log('[Qwen Login] Includes /signin?', url.includes('/signin'));
      console.log('[Qwen Login] ========================================');

      // If user navigated to chat page (not login), they're logged in
      if (url.includes('chat.qwen.ai') && !url.includes('/login') && !url.includes('/signin')) {
        console.log('[Qwen Login] ✅ LOGIN DETECTED - User appears to be logged in');
        console.log('[Qwen Login] Waiting 2 seconds for cookies to settle...');

        // Wait 2 seconds for cookies to settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('[Qwen Login] Extracting credentials...');

        try {
          // Extract credentials
          const allCookies = await session.defaultSession.cookies.get({ domain: '.qwen.ai' });
          console.log('[Qwen Login] Found cookies:', allCookies.length);

          const cookieString = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
          const umidToken = allCookies.find(c => c.name === 'bx-umidtoken')?.value;
          const tokenCookie = allCookies.find(c => c.name === 'token');

          if (!tokenCookie && !umidToken) {
            throw new Error('No authentication tokens found');
          }

          // Decode JWT token to get actual token expiration
          const decodeJWT = (token: string) => {
            try {
              const parts = token.split('.');
              if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
              }
              const payload = parts[1];
              // Convert base64url to base64 (replace - with +, _ with /)
              const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
              // Add padding if needed
              const padded = base64 + '=='.substring(0, (4 - base64.length % 4) % 4);
              const decoded = JSON.parse(Buffer.from(padded, 'base64').toString());
              return decoded;
            } catch (error) {
              console.error('[Qwen Login] JWT decode failed:', error);
              return null;
            }
          };

          // Get token expiration - decode the 'token' cookie specifically (it's the JWT)
          let expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // Default 30 days
          if (tokenCookie?.value) {
            const decoded = decodeJWT(tokenCookie.value);
            if (decoded && decoded.exp) {
              expiresAt = decoded.exp * 1000; // Convert seconds to milliseconds
              console.log('[Qwen Login] JWT token expires:', new Date(expiresAt).toISOString());
            } else {
              console.warn('[Qwen Login] No exp field in JWT or decode failed, using default 30 days');
            }
          } else {
            console.warn('[Qwen Login] No token cookie found for expiration, using default 30 days');
          }

          // Use umidToken if available, otherwise fall back to token
          const actualToken = umidToken || tokenCookie?.value;

          const credentials = {
            token: actualToken,
            cookies: cookieString,
            expiresAt: Math.floor(expiresAt / 1000), // Convert milliseconds to seconds for backend
          };

          console.log('[Qwen Login] Sending credentials to backend...');
          console.log('[Qwen Login] Expires:', new Date(expiresAt).toISOString());
          console.log('[Qwen Login] Credentials payload:', JSON.stringify({
            token: credentials.token?.substring(0, 20) + '...',
            cookies: credentials.cookies?.substring(0, 50) + '...',
            expiresAt: credentials.expiresAt
          }));

          // Send credentials to backend
          const response = await fetch('http://localhost:3002/api/qwen/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          console.log('[Qwen Login] Response status:', response.status);

          if (response.ok) {
            console.log('[Qwen Login] Credentials sent successfully');

            // Show success notification in the window
            if (qwenLoginWindow && !qwenLoginWindow.isDestroyed()) {
              await qwenLoginWindow.webContents.executeJavaScript(`
                (function() {
                  const notification = document.createElement('div');
                  notification.textContent = 'Credentials saved successfully! You can close this window.';
                  notification.style.cssText = \`
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    background: #10b981;
                    color: white;
                    border-radius: 8px;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 999999;
                  \`;
                  document.body.appendChild(notification);
                })();
              `);
            }

            // Don't close window automatically - let user close it
            console.log('[Qwen Login] Credentials saved successfully. Window left open for user.');
            resolve();
          } else {
            const errorText = await response.text();
            console.error('[Qwen Login] Failed to send credentials. Status:', response.status);
            console.error('[Qwen Login] Error response:', errorText);

            // Show error notification in the window
            if (qwenLoginWindow && !qwenLoginWindow.isDestroyed()) {
              await qwenLoginWindow.webContents.executeJavaScript(`
                (function() {
                  const notification = document.createElement('div');
                  notification.textContent = 'Failed to save credentials. Check console for details.';
                  notification.style.cssText = \`
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    background: #ef4444;
                    color: white;
                    border-radius: 8px;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 999999;
                  \`;
                  document.body.appendChild(notification);
                })();
              `);
            }

            throw new Error(`Failed to save credentials: ${errorText}`);
          }
        } catch (error) {
          console.error('[Qwen Login] Failed to extract/send credentials:', error);
          console.error('[Qwen Login] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

          // Don't close window on error - let user see what happened and try again
          reject(error);
        }
      }
    });

    qwenLoginWindow.on('closed', () => {
      qwenLoginWindow = null;
      resolve();
    });

    // Handle errors
    qwenLoginWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('[Qwen Login] Failed to load:', errorDescription);
      reject(new Error(errorDescription));
    });
  });
});

/**
 * IPC Handler: Extract Qwen credentials from cookies
 * Based on doc 48 - Main Process - Extracting Credentials
 */
ipcMain.handle('qwen:extract-credentials', async () => {
  try {
    console.log('[Qwen Extract] Extracting credentials...');

    const defaultSession = session.defaultSession;

    // Get all cookies from qwen.ai domain
    const allCookies = await defaultSession.cookies.get({ domain: '.qwen.ai' });
    console.log('[Qwen Extract] Found cookies:', allCookies.length);

    if (allCookies.length === 0) {
      throw new Error('No cookies found. Please log in to chat.qwen.ai first.');
    }

    // Format cookies as a Cookie header string
    const cookieString = allCookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    // Extract PRIMARY token (JWT)
    const tokenCookie = allCookies.find(c => c.name === 'token');

    // Extract SECONDARY bx-umidtoken
    const umidCookie = allCookies.find(c => c.name === 'bx-umidtoken');
    const umidToken = umidCookie?.value || null;

    // Must have at least one token
    if (!tokenCookie && !umidToken) {
      throw new Error('No authentication tokens found.');
    }

    // Helper function to decode JWT with base64url support (same as in login handler)
    const decodeJWT = (token: string) => {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        const payload = parts[1];
        // Convert base64url to base64 (replace - with +, _ with /)
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const padded = base64 + '=='.substring(0, (4 - base64.length % 4) % 4);
        const decoded = JSON.parse(Buffer.from(padded, 'base64').toString());
        return decoded;
      } catch (error) {
        console.error('[Qwen Extract] JWT decode failed:', error);
        return null;
      }
    };

    // Decode JWT token to get expiration
    let expiresAt: number | null = null;
    if (tokenCookie?.value) {
      const decoded = decodeJWT(tokenCookie.value);
      if (decoded && decoded.exp) {
        expiresAt = decoded.exp * 1000; // Convert seconds to milliseconds
        console.log('[Qwen Extract] Decoded JWT expiration:', new Date(expiresAt).toISOString());
      } else {
        console.log('[Qwen Extract] No exp field in JWT or decode failed');
      }
    }

    // Fallback to cookie expiry or default 30 days
    if (!expiresAt) {
      // Electron cookie expirationDate is in seconds, convert to milliseconds
      expiresAt = allCookies.reduce<number | null>((max, c) => {
        const expiry = c.expirationDate ? c.expirationDate * 1000 : null;
        return expiry && expiry > (max || 0) ? expiry : max;
      }, null) || (Date.now() + (30 * 24 * 60 * 60 * 1000));
      console.log('[Qwen Extract] Using fallback expiration:', new Date(expiresAt).toISOString());
    }

    const credentials = {
      token: umidToken || tokenCookie?.value,
      cookies: cookieString,
      expiresAt: Math.floor(expiresAt / 1000), // Convert milliseconds to seconds for backend
    };

    console.log('[Qwen Extract] Credentials extracted successfully');
    console.log('[Qwen Extract] Expires:', new Date(expiresAt).toISOString());

    return credentials;

  } catch (error) {
    console.error('[Qwen Extract] Failed to extract credentials:', error);
    throw error;
  }
});

/**
 * IPC Handler: Window Controls
 * Based on doc 48 - Main Process - Window Controls
 */
ipcMain.on('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.hide();
    console.log('[Window Controls] Window hidden to tray');
  }
});

ipcMain.on('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
      console.log('[Window Controls] Window unmaximized');
    } else {
      win.maximize();
      console.log('[Window Controls] Window maximized');
    }
  }
});

ipcMain.handle('window:is-maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win?.isMaximized() || false;
});

ipcMain.on('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
    console.log('[Window Controls] Window closed');
  }
});

/**
 * IPC Handler: Clipboard Operations
 */
ipcMain.handle('clipboard:read', () => {
  const text = clipboard.readText();
  console.log('[Clipboard] Read text from clipboard');
  return text;
});

ipcMain.handle('clipboard:write', (_, text: string) => {
  clipboard.writeText(text);
  console.log('[Clipboard] Wrote text to clipboard');
});

/**
 * IPC Handler: App Controls
 */
ipcMain.on('app:quit', () => {
  console.log('[App Controls] Quit requested');
  app.quit();
});

/**
 * IPC Handler: Settings Management
 */
ipcMain.handle('settings:get', (_, key: any) => {
  const value = store.get(key);
  console.log('[Settings] Get:', key, '=', value);
  return value;
});

ipcMain.handle('settings:set', (_, key: any, value: any) => {
  console.log('[Settings] Set:', key, '=', value);
  store.set(key, value);
  console.log('[Settings] Stored successfully');
});

ipcMain.handle('settings:delete', (_, key: any) => {
  console.log('[Settings] Delete:', key);
  store.delete(key);
});

ipcMain.handle('settings:clear', () => {
  console.log('[Settings] Clear all');
  store.clear();
});

/**
 * IPC Handler: History Management
 */
let historyCache: any | null = null;

async function getHistoryFilePath(): Promise<string> {
  const userDataPath = app.getPath('userData');
  const historyDir = path.join(userDataPath, 'path-converter');
  await fs.mkdir(historyDir, { recursive: true });
  return path.join(historyDir, 'history.json');
}

ipcMain.handle('history:read', async () => {
  if (historyCache) {
    console.log('[History] Returning cached history');
    return historyCache;
  }

  try {
    const historyPath = await getHistoryFilePath();
    const data = await fs.readFile(historyPath, 'utf-8');
    historyCache = JSON.parse(data);
    console.log('[History] Loaded history from file');
    return historyCache;
  } catch (error) {
    // File doesn't exist or is invalid, return empty history
    const defaultHistory = { entries: [], maxEntries: 50 };
    historyCache = defaultHistory;
    console.log('[History] Created default history');
    return defaultHistory;
  }
});

ipcMain.handle('history:add', async (_, entry: any) => {
  // First load current history
  const history = historyCache || await ipcMain.emit('history:read');

  // Check if path already exists
  const existingIndex = history.entries.findIndex((e: any) => e.path === entry.path);

  if (existingIndex >= 0) {
    // Update existing entry
    history.entries[existingIndex].timestamp = entry.timestamp;
    history.entries[existingIndex].usageCount += 1;
    console.log('[History] Updated existing entry');
  } else {
    // Add new entry
    history.entries.unshift(entry);

    // Trim to maxEntries
    if (history.entries.length > history.maxEntries) {
      history.entries = history.entries.slice(0, history.maxEntries);
    }
    console.log('[History] Added new entry');
  }

  // Save to file
  const historyPath = await getHistoryFilePath();
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
  historyCache = history;

  return history;
});

ipcMain.handle('history:clear', async () => {
  const historyPath = await getHistoryFilePath();
  const defaultHistory = { entries: [], maxEntries: 50 };
  await fs.writeFile(historyPath, JSON.stringify(defaultHistory, null, 2));
  historyCache = defaultHistory;
  console.log('[History] Cleared history');
  return defaultHistory;
});

/**
 * App lifecycle
 */
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Set isQuitting flag before app quits
app.on('before-quit', () => {
  isQuitting = true;
  console.log('[App] Before quit - isQuitting set to true');
});

// Keep app running in tray when all windows closed
app.on('window-all-closed', () => {
  // Don't quit - keep running in tray
  console.log('[App] All windows closed - keeping app in tray');
});

console.log('[Electron] App started');
