// HARNESS: react-native-streamdown's "Required setup — Bundle Mode", step 2 (its README, Expo variant).
// Replaces the config that install-expo-modules wrote; not a CopilotKit doc step.
const { getDefaultConfig } = require('expo/metro-config');
const {
  getBundleModeMetroConfig,
} = require('react-native-worklets/bundleMode');

const config = getDefaultConfig(__dirname);

// Watch the .worklets/ output directory
config.watchFolders.push(
  require('path').resolve(
    __dirname,
    'node_modules/react-native-worklets/.worklets'
  )
);

module.exports = getBundleModeMetroConfig(config);
