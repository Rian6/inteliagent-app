const base = require("./app.json").expo;
const fs = require("node:fs");
const path = require("node:path");
module.exports = () => {
  const config = { ...base };
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || base.extra?.eas?.projectId;
  const googleServicesFile = process.env.GOOGLE_SERVICES_FILE ||
    (fs.existsSync(path.join(__dirname, "google-services.json")) ? "./google-services.json" : undefined);
  if (projectId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId))
    throw new Error("O ID do projeto EAS deve ser um UUID válido.");
  if (projectId)
    config.extra = { ...base.extra, eas: { ...base.extra?.eas, projectId } };
  if (googleServicesFile) {
    const firebase = JSON.parse(fs.readFileSync(path.resolve(__dirname, googleServicesFile), "utf8"));
    if (!firebase.client?.some(client => client.client_info?.android_client_info?.package_name === base.android.package))
      throw new Error(`O arquivo Firebase deve pertencer ao aplicativo ${base.android.package}.`);
    config.android = {
      ...base.android,
      googleServicesFile,
    };
  }
  if (process.env.REQUIRE_PUSH_CONFIG === "1" && (!projectId || !googleServicesFile))
    throw new Error("Configure o projeto EAS e google-services.json antes de compilar o APK com push.");
  return config;
};
