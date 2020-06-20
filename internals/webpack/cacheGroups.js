module.exports = {
  commons: {
    test: /[\\/]node_modules[\\/](!react)(!react-dom)(!xlsx)(!lodash)(!moment)(!moment-timezone)(!popper.js)(!core-js)(!ajv)[\\/]/,
    name: 'vendor',
    chunks: 'all',
  },
  react: {
    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
    name: 'vendor',
    chunks: 'all',
  },
  utilityvendor: {
    test: /[\\/]node_modules[\\/](lodash|moment|moment-timezone)[\\/]/,
    name: 'utilityvendor',
  },
  ajv: {
    test: /[\\/]node_modules[\\/](ajv)[\\/]/,
    name: 'ajv',
  },
  main: {
    chunks: 'all',
    minChunks: 2,
    reuseExistingChunk: true,
    enforce: true,
  },
};
