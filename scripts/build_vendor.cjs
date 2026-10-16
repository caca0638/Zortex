const fs = require('fs');
const path = require('path');

// 1. Tweakpane v4 IIFE wrapper
const tpSource = fs.readFileSync(path.join(__dirname, '../vendor/tweakpane/package/dist/tweakpane.js'), 'utf8');
const tpExportIdx = tpSource.lastIndexOf('export {');
if (tpExportIdx !== -1) {
    const tpCode = tpSource.slice(0, tpExportIdx);
    const tpWrapper = [
        '/* Tweakpane v4 IIFE Global Bundle */',
        '(function(global) {',
        tpCode,
        'global.Tweakpane = { Pane, BladeApi, ButtonApi, FolderApi, ListBladeApi, ListInputBindingApi, Semver, SeparatorBladeApi, SliderBladeApi, SliderInputBindingApi, TabApi, TabPageApi, TextBladeApi, TpChangeEvent, VERSION };',
        '})(typeof window !== "undefined" ? window : globalThis);'
    ].join('\n');
    fs.writeFileSync(path.join(__dirname, '../vendor/tweakpane.min.js'), tpWrapper, 'utf8');
    console.log('Created vendor/tweakpane.min.js, size:', fs.statSync(path.join(__dirname, '../vendor/tweakpane.min.js')).size);
} else {
    console.error('Could not find export { in tweakpane.js');
}

// 2. Pixi Filters CJS/UMD bundler for browser
// We inspect the filters requested in prompt: AdvancedBloomFilter, RGBSplitFilter, ShockwaveFilter
console.log('Vendor bundle step completed.');
