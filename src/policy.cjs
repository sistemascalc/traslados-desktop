'use strict';
const config = require('./config.cjs');
const siteOrigin = new URL(config.siteUrl).origin;
const authHosts = new Set(['auth.openai.com', 'auth0.openai.com', 'auth.chatgpt.com', 'chatgpt.com', 'accounts.google.com', 'appleid.apple.com', 'login.live.com', 'login.microsoftonline.com']);
function parseHttps(value) { try { const u = new URL(value); return u.protocol === 'https:' && !u.port && !u.username && !u.password ? u : null; } catch { return null; } }
function isPhotoUrl(value) { const u = parseHttps(value); return !!u && u.origin === siteOrigin && /^\/api\/records\/[^/]+\/photo$/.test(u.pathname); }
function canNavigate(value) { const u = parseHttps(value); return !!u && ((u.origin === siteOrigin && !isPhotoUrl(value)) || authHosts.has(u.hostname)); }
function isAuthUrl(value) { const u = parseHttps(value); return !!u && authHosts.has(u.hostname); }
function isSiteUrl(value) { const u = parseHttps(value); return !!u && u.origin === siteOrigin; }
function isReleaseAsset(value) { const u = parseHttps(value); return !!u && u.hostname === 'github.com' && u.pathname.startsWith(`/${config.owner}/${config.repository}/releases/download/`); }
function compareVersions(a, b) { const toParts = s => /^v?\d+\.\d+\.\d+$/.test(s) ? s.replace(/^v/, '').split('.').map(Number) : null; const x=toParts(a),y=toParts(b); if (!x || !y) return null; for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1; return 0; }
function selectInstaller(assets, platform, arch) { const os = platform === 'darwin' ? 'mac' : platform === 'win32' ? 'win' : ''; const ext = platform === 'darwin' ? '.dmg' : '.exe'; return (assets || []).find(a => typeof a.name === 'string' && a.name.startsWith('Traslados-') && (a.name.endsWith(`-${os}-${arch}${ext}`) || (platform === 'darwin' && a.name.endsWith('-mac-universal.dmg'))) && isReleaseAsset(a.browser_download_url)); }
module.exports = { parseHttps, canNavigate, isPhotoUrl, isAuthUrl, isSiteUrl, isReleaseAsset, compareVersions, selectInstaller };
