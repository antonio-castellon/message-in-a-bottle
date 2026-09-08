const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

/**
 * Windows ninja/CMake fails when object paths exceed 260 chars
 * (typical with RN codegen under a deep project folder).
 */
function withWindowsCmake(config) {
  config = withGradleProperties(config, (mod) => {
    const existing = mod.modResults.find(
      (item) => item.type === 'property' && item.key === 'reactNativeArchitectures',
    );
    if (existing) {
      existing.value = 'arm64-v8a';
    } else {
      mod.modResults.push({ type: 'property', key: 'reactNativeArchitectures', value: 'arm64-v8a' });
    }
    return mod;
  });

  config = withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes('CMAKE_OBJECT_PATH_MAX')) return mod;
    mod.modResults.contents = mod.modResults.contents.replace(
      /versionName "1\.0\.0"/,
      `versionName "1.0.0"

        externalNativeBuild {
            cmake {
                arguments "-DCMAKE_OBJECT_PATH_MAX=128"
            }
        }
        ndk {
            abiFilters "arm64-v8a"
        }`,
    );
    return mod;
  });

  return config;
}

module.exports = withWindowsCmake;
