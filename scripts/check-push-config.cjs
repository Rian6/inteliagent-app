const path = require("node:path");
const fs = require("node:fs");
const root = path.resolve(__dirname, "..");
process.env.NODE_ENV ||= "development";
require("@expo/env").load(root);
const config = require("../app.config.js")();
const missing = [];
if (!config.extra?.eas?.projectId) missing.push("Vincule um projeto Expo com eas init.");
if (!config.android?.googleServicesFile) missing.push("Cadastre o aplicativo Android no Firebase e baixe google-services.json.");
const native = path.join(root, "android/app/google-services.json");
if (config.android?.googleServicesFile && fs.existsSync(path.join(root, "android")) && !fs.existsSync(native))
  missing.push("Execute expo prebuild --platform android para atualizar o projeto nativo com Firebase.");
if (missing.length) {
  console.error(missing.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Configuração local de push pronta para compilar o Android.");
  console.log("A credencial FCM v1 deve estar cadastrada no projeto EAS. Teste a entrega em um build próprio, fora do Expo Go.");
}
