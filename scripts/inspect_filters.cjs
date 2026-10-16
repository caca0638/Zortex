const fs = require('fs');
const content = fs.readFileSync('vendor/pixi-filters.min.js', 'utf8');
console.log('Size of vendor/pixi-filters.min.js:', content.length);
console.log('Start:', content.slice(0, 150));
console.log('End:', content.slice(-150));
