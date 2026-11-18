// HARNESS: react-native-streamdown's "Required setup — Bundle Mode" (its README, Expo variant).
// The CopilotKit Prebuilt Components / Markdown pages only say to follow the library's guide; without
// this every rendered-chat reply crashes: "[Worklets] Tried to synchronously call a Remote Function".
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'react-native-worklets/plugin',
        {
          bundleMode: true,
          importForwarding: {
            moduleNames: ['remend'],
          },
        },
      ],
    ],
  };
};
