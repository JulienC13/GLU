const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Le SDK Firebase JS (v11+) expose via "exports" un build non transpilé
// (propriétés privées de classe) que Hermes ne supporte pas encore.
// On force Metro à utiliser le build classique via "main"/"browser".
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' });
