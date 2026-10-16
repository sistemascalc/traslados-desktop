'use strict';
const { app, BrowserWindow, Menu, dialog, shell, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { canNavigate, isAuthUrl, isPhotoUrl, parseHttps } = require('./policy.cjs');
const { checkForUpdates } = require('./updater.cjs');
const config = require('./config.cjs');
const verifyPackage = process.argv.includes('--verify-package');
const offlinePath = path.join(__dirname, 'offline.html');
const offlineUrl = pathToFileURL(offlinePath).href;
const preferences = { partition: 'persist:traslados', sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true, allowRunningInsecureContent: false, webviewTag: false };
let mainWindow;
let externalPrompt = false;
app.setName('Traslados');
if (verifyPackage) app.setPath('userData', path.join(app.getPath('temp'), 'traslados-package-verification'));
app.enableSandbox();
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } });
  app.whenReady().then(() => {
    const isolatedSession = session.fromPartition(preferences.partition);
    isolatedSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    isolatedSession.setPermissionCheckHandler(() => false);
    app.on('web-contents-created', (_event, contents) => {
      contents.on('will-attach-webview', event => event.preventDefault());
      const guard = (event, url) => {
        if (canNavigate(url) || url === offlineUrl) return;
        event.preventDefault();
      };
      contents.on('will-navigate', guard);
      contents.on('will-redirect', guard);
      contents.setWindowOpenHandler(({ url }) => {
        if (isAuthUrl(url)) return { action: 'allow', overrideBrowserWindowOptions: { width: 650, height: 780, title: 'Iniciar sesión en Traslados', autoHideMenuBar: true, webPreferences: { ...preferences } } };
        if (parseHttps(url) && !isPhotoUrl(url)) void openExternalLink(url);
        return { action: 'deny' };
      });
    });
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
}
app.on('window-all-closed', () => { if (process.platform !== 'darwin' || verifyPackage) app.quit(); });
async function openExternalLink(url) {
  if (externalPrompt || !mainWindow || mainWindow.isDestroyed()) return;
  externalPrompt = true;
  try {
    const answer = await dialog.showMessageBox(mainWindow, { type: 'question', title: 'Abrir enlace', message: 'Este enlace se abrirá en tu navegador.', detail: new URL(url).hostname, buttons: ['Abrir enlace', 'Cancelar'], defaultId: 1, cancelId: 1 });
    if (answer.response === 0) await shell.openExternal(url);
  } finally { externalPrompt = false; }
}
function createWindow() {
  mainWindow = new BrowserWindow({ width: 1300, height: 880, minWidth: 800, minHeight: 600, title: 'Traslados', backgroundColor: '#faf9f6', icon: path.join(__dirname, '../assets/icon.png'), show: !verifyPackage, webPreferences: { ...preferences } });
  mainWindow.on('closed', () => { mainWindow = null; });
  const home = () => mainWindow?.loadURL(config.siteUrl).catch(() => {});
  const appMenu = { label: 'Traslados', submenu: [
    { label: `Acerca de Traslados ${app.getVersion()}`, click: () => dialog.showMessageBox(mainWindow, { type: 'info', title: 'Traslados', message: 'Traslados matrimoniales', detail: `Versión ${app.getVersion()}\nRecepción · Capellanía · Regreso\nRequiere conexión e inicio de sesión.`, icon: path.join(__dirname, '../assets/icon.png'), buttons: ['Listo'] }) },
    { label: 'Buscar actualizaciones…', click: () => checkForUpdates(mainWindow) },
    { type: 'separator' }, ...(process.platform === 'darwin' ? [{ role: 'hide', label: 'Ocultar Traslados' }, { role: 'hideOthers', label: 'Ocultar otras' }, { type: 'separator' }] : []),
    { role: 'quit', label: 'Salir de Traslados' }
  ] };
  Menu.setApplicationMenu(Menu.buildFromTemplate([appMenu,
    { label: 'Registro', submenu: [{ label: 'Inicio / Reintentar conexión', click: home }, { role: 'reload', label: 'Recargar', accelerator: 'CmdOrCtrl+R' }, { type: 'separator' }, { role: 'print', label: 'Imprimir…' }] },
    { label: 'Edición', submenu: [{ role: 'undo', label: 'Deshacer' }, { role: 'redo', label: 'Rehacer' }, { type: 'separator' }, { role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' }, { role: 'selectAll', label: 'Seleccionar todo' }] },
    { label: 'Vista', submenu: [{ role: 'resetZoom', label: 'Tamaño original' }, { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' }, { role: 'togglefullscreen', label: 'Pantalla completa' }] }
  ]));
  mainWindow.webContents.on('did-fail-load', (_event, code, _description, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && url !== offlineUrl && mainWindow) void mainWindow.loadFile(offlinePath);
  });
  if (verifyPackage) {
    const timeout = setTimeout(() => app.exit(1), 20000);
    mainWindow.webContents.once('did-finish-load', () => {
      const actual = mainWindow.webContents.getLastWebPreferences();
      const safe = actual.sandbox && actual.contextIsolation && !actual.nodeIntegration && actual.webSecurity && !actual.allowRunningInsecureContent && !actual.webviewTag;
      console.log(JSON.stringify({ packaged: app.isPackaged, version: app.getVersion(), electron: process.versions.electron, arch: process.arch, security: !!safe, localPageLoaded: mainWindow.webContents.getURL() === offlineUrl, updateMenu: !!Menu.getApplicationMenu().items[0].submenu.items.find(x => x.label === 'Buscar actualizaciones…') }));
      clearTimeout(timeout); app.exit(safe && app.isPackaged ? 0 : 1);
    });
    void mainWindow.loadFile(offlinePath);
  } else home();
}
