import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const source = dirname(require.resolve('@fontsource/poppins/package.json'));
const destination = resolve(import.meta.dirname,'../dist/modules/assets/fonts');
mkdirSync(destination,{recursive:true});
let css = '/* Optional host font input; import explicitly. No reset, selectors or application globals. */\n';
for(const weight of [400,500,600,700,800]) {
 const name=`poppins-latin-${weight}-normal.woff2`;
 copyFileSync(resolve(source,'files',name),resolve(destination,name));
 css+=`@font-face{font-family:Poppins;font-style:normal;font-weight:${weight};font-display:swap;src:url('./assets/fonts/${name}') format('woff2');}\n`;
}
writeFileSync(resolve(destination,'../../fonts.css'),css);
copyFileSync(resolve(source,'LICENSE'),resolve(destination,'../../POPPINS-LICENSE.txt'));
console.log('PASS: optional Poppins host stylesheet and five declared font assets prepared.');

writeFileSync(resolve(destination,'../../index.d.ts'), "export * from './types/modules/index';\n");
