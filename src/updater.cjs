'use strict';
const { app, dialog, net, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const config = require('./config.cjs');
const { compareVersions, selectInstaller } = require('./policy.cjs');
let busy = false;
async function checkForUpdates(window) {
  if (busy) return;
  busy = true;
  try {
    const response = await net.fetch(config.releaseApi, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(20000) });
    if (response.status === 404) { await dialog.showMessageBox(window, { type: 'info', title: 'Actualizaciones', message: 'Todavía no hay una versión publicada en GitHub.', detail: `Versión instalada: ${app.getVersion()}.`, buttons: ['Entendido'] }); return; }
    if (!response.ok) throw new Error('No se pudo consultar GitHub.');
    const release = await response.json();
    const compared = compareVersions(release.tag_name, app.getVersion());
    if (compared === null) throw new Error('La versión publicada no tiene un formato válido.');
    if (compared <= 0) { await dialog.showMessageBox(window, { type: 'info', title: 'Traslados está actualizado', message: 'Ya tienes la versión más reciente.', detail: `Versión ${app.getVersion()}`, buttons: ['Listo'] }); return; }
    const signed = require('../package.json').signedUpdates?.[process.platform] === true;
    if (signed && app.isPackaged) {
      autoUpdater.autoDownload = false; autoUpdater.autoInstallOnAppQuit = false; autoUpdater.allowDowngrade = false;
      autoUpdater.logger = null;
      const update = await autoUpdater.checkForUpdates();
      if (!update?.updateInfo || compareVersions(update.updateInfo.version, app.getVersion()) !== 1) return;
      const choice = await dialog.showMessageBox(window, { type: 'info', title: 'Nueva versión de Traslados', message: `Está disponible la versión ${update.updateInfo.version}.`, detail: 'Tus registros y fotos permanecen en tu cuenta. Guarda cualquier formulario antes de reiniciar.', buttons: ['Descargar actualización', 'Más tarde'], defaultId: 0, cancelId: 1 });
      if (choice.response !== 0) return;
      const progress = value => window.setProgressBar(value.percent / 100);
      autoUpdater.on('download-progress', progress);
      try { await autoUpdater.downloadUpdate(); } finally { autoUpdater.off('download-progress', progress); window.setProgressBar(-1); }
      const install = await dialog.showMessageBox(window, { type: 'info', title: 'Actualización lista', message: 'La actualización ya se descargó.', detail: 'Guarda tus cambios antes de reiniciar.', buttons: ['Reiniciar e instalar', 'Después'], defaultId: 1, cancelId: 1 });
      if (install.response === 0) autoUpdater.quitAndInstall();
      return;
    }
    const installer = selectInstaller(release.assets, process.platform, process.arch);
    if (!installer) throw new Error('La nueva versión aún no tiene instalador para esta computadora.');
    const choice = await dialog.showMessageBox(window, { type: 'info', title: 'Nueva versión disponible', message: `Traslados ${release.tag_name.replace(/^v/, '')} está disponible.`, detail: 'Descarga el instalador de GitHub y úsalo para reemplazar la aplicación. Tus registros y fotos se conservan en tu cuenta. Esta edición utiliza actualización mediante instalador.', buttons: ['Descargar instalador', 'Más tarde'], defaultId: 0, cancelId: 1 });
    if (choice.response === 0) await shell.openExternal(installer.browser_download_url);
  } catch (error) {
    await dialog.showMessageBox(window, { type: 'warning', title: 'No se pudo comprobar la actualización', message: 'No se pudo consultar o descargar la actualización.', detail: 'Comprueba tu conexión e inténtalo de nuevo desde el menú Traslados. Tu registro sigue disponible.', buttons: ['Entendido'] });
  } finally { busy = false; if (!window.isDestroyed()) window.setProgressBar(-1); }
}
autoUpdater.on('error', () => {});
module.exports = { checkForUpdates };
