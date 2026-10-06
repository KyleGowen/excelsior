import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const frontend=resolve(import.meta.dirname,'../../frontend');
const fixture=mkdtempSync(resolve(frontend,'src/boundary-test-'));
const checker=resolve(frontend,'scripts/check-module-boundaries.mjs');
try {
 for(const [name,source,message] of [
  ['backend',"import '../../../src/index';",'Forbidden module dependency'],
  ['node',"import fs from 'node:fs';",'Node import'],
  ['global',"window.excelsiorCatalog = [];",'Undeclared browser application global'],
  ['indexed-global',"window['excelsiorCatalog'];",'Undeclared indexed'],
  ['dynamic',"const path='./helper'; import(path);",'Undeclared dynamic import'],
  ['rule',"const drawRandomHand = () => [];",'Retired domain rule'],
  ['named-alias',"function cardSearchAliases() { return []; }",'Retired domain rule'],
  ['named-foil',"const missingSkyboundFoilPrinting = () => null;",'Retired domain rule'],
  ['collection-totals',"const guestCollectionTotals = () => ({totalOwned:0});",'Retired domain rule'],
  ['collection-evaluation',"function evaluateCollection() { return {}; }",'Retired domain rule'],
  ['resource',"const url='/src/resources/cards/images/a.webp';",'Excelsior resource URL'],
  ['dependency',"import something from 'undeclared-package';",'Undeclared browser package'],
 ]) test(`rejects ${name}`,()=>{
  const entry=resolve(fixture,`${name}.ts`);writeFileSync(entry,source);
  const result=spawnSync(process.execPath,[checker,entry],{encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,new RegExp(message));
 });
 test.after(()=>rmSync(fixture,{recursive:true}));
} catch(error) {rmSync(fixture,{recursive:true});throw error;}
