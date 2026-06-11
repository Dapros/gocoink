module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Este plugin DEBE ser el último de la lista siempre
      'react-native-reanimated/plugin',
    ],
  };
};