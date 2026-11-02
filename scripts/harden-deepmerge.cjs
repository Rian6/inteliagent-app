// Temporary backport for GHSA-gcqx-w48m-w2h4. Remove when upstream fixes 4.3.1.
const fs = require('node:fs');
const path = require('node:path');
const entry = require.resolve('deepmerge');
const source = fs.readFileSync(entry, 'utf8');
const original = 'return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))';
const hardened = 'return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target)).filter(function(key) { return key !== "__proto__" && key !== "constructor" && key !== "prototype" })';
if (!source.includes(hardened)) {
  if (!source.includes(original)) throw new Error('deepmerge changed: review the security backport before installing');
  fs.writeFileSync(entry, source.replace(original, hardened));
}
const merge = require('deepmerge');
for (const value of [JSON.parse('{"__proto__":{"poisoned":true}}'), Object.assign(Object.create(null), JSON.parse('{"__proto__":{"poisoned":true}}'))]) {
  const result = merge(value, {});
  if (Object.getPrototypeOf(result) !== Object.prototype || result.poisoned || ({}).poisoned) throw new Error('deepmerge prototype safety regression');
}
console.log('deepmerge prototype safety backport verified');
