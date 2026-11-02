// Temporary backport for GHSA-gcqx-w48m-w2h4. Remove when upstream fixes 4.3.1.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const lock = JSON.parse(
  fs.readFileSync(path.join(root, "package-lock.json"), "utf8"),
);
const packages = Object.keys(lock.packages || {}).filter((name) =>
  /(^|\/)node_modules\/deepmerge$/.test(name),
);
for (const packagePath of packages) {
  const packageRoot = path.join(root, packagePath);
  if (!fs.existsSync(packageRoot)) continue;
  const entry = require.resolve(packageRoot);
  const source = fs.readFileSync(entry, "utf8");
  const original =
    "return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))";
  const hardened =
    'return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target)).filter(function(key) { return key !== "__proto__" && key !== "constructor" && key !== "prototype" })';
  if (!source.includes(hardened)) {
    if (!source.includes(original))
      throw new Error(
        "deepmerge changed: review the security backport before installing",
      );
    fs.writeFileSync(entry, source.replace(original, hardened));
  }
  const merge = require(entry);
  for (const value of [
    JSON.parse('{"__proto__":{"poisoned":true}}'),
    Object.assign(
      Object.create(null),
      JSON.parse('{"__proto__":{"poisoned":true}}'),
    ),
  ]) {
    const result = merge(value, {});
    if (
      Object.getPrototypeOf(result) !== Object.prototype ||
      result.poisoned ||
      {}.poisoned
    )
      throw new Error("deepmerge prototype safety regression");
  }
}
console.log("deepmerge prototype safety backport verified");
