/**
 * =============================================================================
 * ZORTEX: CYBER SURVIVOR - NATIVE DESKTOP PRELOAD BRIDGE
 * =============================================================================
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ZortexNative', {
  isDesktopApp: true,
  platform: process.platform,
  quitGame: () => ipcRenderer.invoke('zortex:quit'),
  toggleFullscreen: () => ipcRenderer.invoke('zortex:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('zortex:is-fullscreen')
});
