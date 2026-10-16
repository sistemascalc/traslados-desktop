'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { canNavigate, isPhotoUrl, isReleaseAsset, compareVersions, selectInstaller } = require('../src/policy.cjs');
const { siteUrl } = require('../src/config.cjs');
test('solo permite el sitio y destinos de autenticación HTTPS conocidos', () => {
  assert.equal(canNavigate(siteUrl), true);
  assert.equal(canNavigate('https://auth.openai.com/authorize'), true);
  for (const url of ['http://auth.openai.com', 'https://auth.openai.com.evil.test/', 'https://evil.test', 'javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hello', 'https://user:pass@auth.openai.com', 'https://auth.openai.com:8443/']) assert.equal(canNavigate(url), false, url);
});
test('las fotos no reemplazan la página ni se abren en otra ventana', () => {
  const photo = `${siteUrl}api/records/test/photo?v=2`;
  assert.equal(isPhotoUrl(photo), true); assert.equal(canNavigate(photo), false);
  assert.equal(isPhotoUrl('https://evil.test/api/records/test/photo'), false);
});
test('compara versiones numéricamente y rechaza datos ambiguos', () => {
  assert.equal(compareVersions('v1.10.0', '1.2.9'), 1);
  assert.equal(compareVersions('v1.0.0', '1.0.0'), 0);
  assert.equal(compareVersions('0.9.0', '1.0.0'), -1);
  assert.equal(compareVersions('1.0.1-beta', '1.0.0'), null);
});
test('selecciona el instalador de la plataforma y del repositorio correcto', () => {
  const asset = name => ({ name, browser_download_url: `https://github.com/sistemascalc/traslados-desktop/releases/download/v1.0.1/${name}` });
  const mac = asset('Traslados-1.0.1-mac-universal.dmg'), win = asset('Traslados-1.0.1-win-x64.exe');
  const wrong = { ...win, browser_download_url: 'https://github.com/other/repo/releases/download/v1/installer.exe' };
  assert.equal(selectInstaller([wrong, mac, win], 'win32', 'x64'), win);
  assert.equal(selectInstaller([mac, win], 'darwin', 'arm64'), mac);
  assert.equal(selectInstaller([mac, win], 'darwin', 'x64'), mac);
  assert.equal(selectInstaller([mac, win], 'win32', 'arm64'), undefined);
  assert.equal(isReleaseAsset('https://github.com/sistemascalc/traslados-desktop/releases/download/../../../evil'), false);
});
