'use strict';
const fs = require('node:fs');
const p = require('../package.json');
p.signedUpdates = { darwin: !!process.env.MAC_CSC_LINK, win32: !!process.env.WIN_CSC_LINK };
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
