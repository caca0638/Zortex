const esbuild = require('esbuild');
const path = require('path');

const pixiPlugin = {
    name: 'pixi-shim',
    setup(build) {
        build.onResolve({ filter: /^pixi\.js$/ }, args => ({
            path: args.path,
            namespace: 'pixi-virtual'
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

async function build() {
    await esbuild.build({
        entryPoints: [path.join(__dirname, 'filters_entry.js')],
        bundle: true,
        format: 'iife',
        globalName: 'PIXI_FILTERS',
        outfile: path.join(__dirname, '../vendor/pixi-filters.min.js'),
        plugins: [pixiPlugin]
    });
    console.log('Successfully bundled pixi-filters using window.PIXI shim (zero duplicate classes).');
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
