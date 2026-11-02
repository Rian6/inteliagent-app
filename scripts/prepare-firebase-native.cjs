const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const config = require("../app.config.js")();
const source = config.android?.googleServicesFile;
const native = path.join(root, "android", "app");
if (source && fs.existsSync(native)) {
  const target = path.join(native, "google-services.json");
  const resolved = path.resolve(root, source);
  if (resolved !== target) fs.copyFileSync(resolved, target);
  console.log("Configuração Firebase aplicada ao projeto Android.");
}
