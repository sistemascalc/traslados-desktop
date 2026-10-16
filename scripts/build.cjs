'use strict';
const { spawnSync } = require('node:child_process');
const platform = process.argv[2];
if (!['mac', 'win'].includes(platform)) throw new Error('Plataforma no válida.');
const env = { ...process.env };
// GitHub passes unset secrets as empty strings. Builder interprets an empty
// CSC_LINK as the current directory, so omit it when no certificate exists.
for (const key of ['CSC_LINK', 'CSC_KEY_PASSWORD', 'APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID']) if (!env[key]?.trim()) delete env[key];
const args = platform === 'mac' ? ['--mac', 'dmg', 'zip'] : ['--win', 'nsis', '--x64'];
const result = spawnSync(process.execPath, [require.resolve('electron-builder/out/cli/cli.js'), ...args, '--publish', 'never', ...process.argv.slice(3)], { stdio: 'inherit', env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
