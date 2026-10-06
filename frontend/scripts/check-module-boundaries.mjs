import ts from 'typescript';
import { readFileSync, existsSync, statSync, realpathSync } from 'node:fs';
import { resolve, dirname, extname, relative, sep } from 'node:path';
const root = realpathSync(resolve(import.meta.dirname,'../src'));
const entry = resolve(process.argv[2] ?? resolve(root,'modules/index.ts'));
const seen = new Set(), externals = new Set();
const banned = /(?:^|\/)(?:app|stories|deck-usability\/(?:deckUsabilityUtils|isCatalogCardUsable|buildDeckUsabilityContext)|decks\/(?:extractCardsFromImportJson|resolveImportCardIds|importDeckFromJson|deckMaxStats))(?:\/|\.)/;
const retiredRules = new Set(['drawRandomHand','buildDrawPile','analyzeDrawnHand','drawHandVentureValue','buildKoDimmingContext','calculateDeckTotalThreat','calculateDeckIconTotals','effectiveCharacterStats','effectiveTeamCharacterStats','isCatalogCardUsable','resolveImportCardIds','computePrePlacedFlags','reconcilePrePlaced','isPrePlacedEligible','normalizeAngryMobVariant','normalizeTeamworkMechanic','normalizeTeamworkFollowups','cardSearchAliases','missingSkyboundFoilPrinting']);
function visitFile(file) {
 file = realpathSync(file);
 if (!file.startsWith(root + sep) || banned.test(file)) throw new Error(`Forbidden module dependency: ${file}`);
 if (seen.has(file)) return; seen.add(file);
 const text = readFileSync(file,'utf8');
 if (/\/src\/resources\//.test(text)) throw new Error(`Excelsior resource URL in module graph: ${relative(root,file)}`);
 const css = extname(file) === '.css';
 const source = ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
 const inputs=[];
 if(css) for (const m of text.matchAll(/@import\s+['"]([^'"]+)['"]/g)) inputs.push(m[1]);
 else {
  function walk(node) {
   if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) inputs.push(node.moduleSpecifier.text);
   if(ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) inputs.push(node.argument.literal.text);
   if(ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    if(!node.arguments[0] || !ts.isStringLiteral(node.arguments[0])) throw new Error(`Undeclared dynamic import in ${file}`);
    inputs.push(node.arguments[0].text);
   }
   if(ts.isIdentifier(node) && ['process','Buffer','__dirname','__filename','require'].includes(node.text)) throw new Error(`Node runtime/global ${node.text} in ${file}`);
   if(ts.isPropertyAccessExpression(node) && ['window','globalThis'].includes(node.expression.getText(source)) && !['addEventListener','removeEventListener','setTimeout','clearTimeout','innerWidth','innerHeight','matchMedia','requestAnimationFrame','cancelAnimationFrame','getComputedStyle','location','history','scrollTo','dispatchEvent','localStorage','sessionStorage','visualViewport','devicePixelRatio'].includes(node.name.text)) throw new Error(`Undeclared browser application global ${node.getText(source)} in ${file}`);
   if((ts.isFunctionDeclaration(node) || (ts.isVariableDeclaration(node) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) || ts.isMethodDeclaration(node)) && node.name && retiredRules.has(node.name.getText(source))) throw new Error(`Retired domain rule ${node.name.text} in browser graph: ${file}`);
   if(ts.isElementAccessExpression(node) && ['window','globalThis'].includes(node.expression.getText(source))) throw new Error(`Undeclared indexed browser application global in ${file}`);
   ts.forEachChild(node,walk);
  } walk(source);
 }
 for (const input of inputs) {
  if(!input.startsWith('.') && !input.startsWith('@/')) { if(input.startsWith('node:')) throw new Error(`Node import ${input}`); externals.add(input);continue; }
  const clean=input.split('?')[0]; const path=clean.startsWith('@/') ? resolve(root,clean.slice(2)) : resolve(dirname(file),clean);
  const found=[path,...['.ts','.tsx','.css','/index.ts','/index.tsx'].map(e => path+e)].find(p => existsSync(p) && statSync(p).isFile());
  if(!found) throw new Error(`Missing declared input ${input} from ${file}`);
  if(['.png','.webp','.svg','.woff','.woff2'].includes(extname(found))) { if(!realpathSync(found).startsWith(root+sep)) throw new Error(`External asset ${found}`);seen.add(found);continue; }
  visitFile(found);
 }
}
visitFile(entry);
const dependencies = JSON.parse(readFileSync(resolve(root,'../package.json'),'utf8')).dependencies;
for(const input of externals) {
 const pkg=input.startsWith('@') ? input.split('/').slice(0,2).join('/') : input.split('/')[0];
 if(!dependencies[pkg]) throw new Error(`Undeclared browser package: ${input}`);
}
console.log(JSON.stringify({status:'passed',inputs:seen.size,externals:[...externals].sort()},null,2));
