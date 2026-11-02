const { withAndroidManifest, withDangerousMod, withAppBuildGradle } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

function configureGradle(contents) {
  const notificationsRoot = path.dirname(require.resolve("expo-notifications/package.json"));
  const source = fs.readFileSync(path.join(notificationsRoot, "android/build.gradle"), "utf8");
  const version = source.match(/com\.google\.firebase:firebase-messaging:([\w.+-]+)/)?.[1];
  if (!version) throw new Error("Verifique a versão nativa do Firebase usada pelo expo-notifications.");
  const dependency = `implementation("com.google.firebase:firebase-messaging:${version}") // inteliagent-native-push`;
  if (contents.includes("// inteliagent-native-push"))
    return contents.replace(/implementation\("com\.google\.firebase:firebase-messaging:[^"]+"\) \/\/ inteliagent-native-push/, dependency);
  return contents.replace(/dependencies\s*\{/, match => `${match}\n    ${dependency}`);
}

function configureManifest(manifest) {
  manifest.manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
  const app = manifest.manifest.application[0];
  app.service = (app.service || []).filter(service => ![
    ".InteliagentMessagingService",
    "expo.modules.notifications.service.ExpoFirebaseMessagingService",
  ].includes(service.$["android:name"]));
  app.service.push(
    { $: { "android:name": "expo.modules.notifications.service.ExpoFirebaseMessagingService", "tools:node": "remove" } },
    { $: { "android:name": ".InteliagentMessagingService", "android:exported": "false" },
      "intent-filter": [{ $: { "android:priority": "0" }, action: [{ $: { "android:name": "com.google.firebase.MESSAGING_EVENT" } }] }] },
  );
  return manifest;
}

function writeNativeService(projectRoot, packageName) {
  const directory = path.join(projectRoot, "android/app/src/main/java", ...packageName.split("."));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "InteliagentMessagingService.kt"), `package ${packageName}

import android.content.Intent
import expo.modules.notifications.service.ExpoFirebaseMessagingService

/** Keep Expo push taps intact after Android reclaims a background process.
 * FCM's auto-rendered intent can lose extras when a singleTask record survives.
 * Use Expo's notification builder and forwarder instead, including in that state.
 * See https://github.com/expo/expo/issues/49254
 */
class InteliagentMessagingService : ExpoFirebaseMessagingService() {
  override fun handleIntent(intent: Intent?) {
    val extras = intent?.extras
    if (extras != null && (extras.containsKey("scopeKey") || extras.containsKey("experienceId"))) {
      val notificationKeys = extras.keySet().filter {
        it.startsWith("gcm.n.") || it.startsWith("gcm.notification.")
      }
      if (notificationKeys.isNotEmpty()) {
        val notificationIntent = Intent(intent)
        notificationKeys.forEach { notificationIntent.removeExtra(it) }
        super.handleIntent(notificationIntent)
        return
      }
    }
    super.handleIntent(intent)
  }
}
`);
}

module.exports = config => {
  config = withAppBuildGradle(config, result => {
    result.modResults.contents = configureGradle(result.modResults.contents);
    return result;
  });
  config = withAndroidManifest(config, result => {
    result.modResults = configureManifest(result.modResults);
    return result;
  });
  return withDangerousMod(config, ["android", async result => {
    writeNativeService(result.modRequest.projectRoot, result.android.package);
    return result;
  }]);
};
module.exports.configureManifest = configureManifest;
module.exports.writeNativeService = writeNativeService;
module.exports.configureGradle = configureGradle;
