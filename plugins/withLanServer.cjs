const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
module.exports = config => {
  config = withAndroidManifest(config, result => {
  // Internal distribution uses the user's LAN HTTP server.
  result.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
  return result;
  });
  return withDangerousMod(config, ['android', async result => {
    const file = path.join(result.modRequest.projectRoot, 'android/app/proguard-rules.pro');
    let source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    for (const rule of [
      '-keep class * extends androidx.room.RoomDatabase { *; }',
      '-keep class androidx.work.impl.WorkDatabase_Impl { *; }',
    ]) if (!source.includes(rule)) source += '\n' + rule + '\n';
    fs.writeFileSync(file, source);
    return result;
  }]);
};
