const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');
// Native build outputs can contain thousands of generated files and junctions.
// They never supply JavaScript to Metro and must not be crawled on Windows.
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const excluded = ['android', 'dist', '.git'].map(directory =>
  new RegExp(`^${escapeRegex(path.resolve(__dirname, directory))}[\\\\/]`),
);
config.resolver.blockList = [
  ...[config.resolver.blockList].flat().filter(Boolean),
  ...excluded,
  /[\\/]node_modules[\\/](?:@[^\\/]+[\\/])?[^\\/]+[\\/]android[\\/](?:build|\.cxx|\.gradle)[\\/]/,
];
config.maxWorkers = 2;
module.exports = config;
