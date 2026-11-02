const {
  withGradleProperties,
  withProjectBuildGradle,
} = require("expo/config-plugins");

// Expo's native plugin owns CMake configuration. Use its public Gradle property
// so the application and every library share a Win32/Ninja-safe path limit.
module.exports = (config) => {
  config = withGradleProperties(config, (result) => {
    result.modResults = result.modResults.filter(
      (item) => item.key !== "expo.android.cmakeObjectPathMax",
    );
    result.modResults.push({
      type: "property",
      key: "expo.android.cmakeObjectPathMax",
      value: "250",
    });
    return result;
  });
  return withProjectBuildGradle(config, (result) => {
    const marker = "// inteliagent-short-cmake-paths";
    const block = `\n${marker}
subprojects { p ->
    ['com.android.application', 'com.android.library'].each { plugin ->
        p.plugins.withId(plugin) {
            p.extensions.getByName('android').externalNativeBuild.cmake.buildStagingDirectory = new File(rootDir, "../../.cxx/" + Integer.toHexString(p.path.hashCode()))
        }
    }
}
`;
    if (!result.modResults.contents.includes(marker))
      result.modResults.contents = result.modResults.contents.replace(
        'apply plugin: "expo-root-project"',
        block + '\napply plugin: "expo-root-project"',
      );
    return result;
  });
};
