const esbuild = require('esbuild');
const path = require('path');

const pixiPlugin = {
    name: 'pixi-shim',
    setup(build) {
        build.onResolve({ filter: /^pixi\.js$/ }, args => ({
            path: args.path, namespace: 'pixi-virtual'
        }));
        build.onLoad({ filter: /.*/, namespace: 'pixi-virtual' }, () => ({
            contents: `
                const P = (typeof window !== 'undefined' ? window.PIXI : globalThis.PIXI) || {};
                module.exports = P;
            `,
            loader: 'js'
        }));
    }
};

async function test() {
    const res = await esbuild.build({
        entryPoints: [path.join(__dirname, 'filters_entry.js')],
        bundle: true,
        format: 'iife',
        globalName: 'PIXI_FILTERS',
        write: false,
        plugins: [pixiPlugin]
    });
    console.log('Build succeeded! Output size:', res.outputFiles[0].text.length);
}

test().catch(err => {
    console.error('Build failed:', err);
});
