const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {HashedModuleIdsPlugin} = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const REST_API = process.env.REST_API;
let api = '';

if (REST_API) {
  api = REST_API;
}

let publicPath = `${api}build/`;
let jsonpFunction = 'maxJsonpForm3';
const entry = `app/app.js`;
let plugins = [
  new HtmlWebpackPlugin({
    template: 'app/index.html',
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
    inject: true,
  }),
  new CompressionPlugin({
    algorithm: 'gzip',
    test: /\.js$|\.css$|\.html$/,
    threshold: 10240,
    minRatio: 0.8,
  }),
  new HashedModuleIdsPlugin({
    hashFunction: 'sha256',
    hashDigest: 'hex',
    hashDigestLength: 20,
  }),
];
if (REST_API) {
  plugins.push(
    new webpack.DefinePlugin({
      'process.env.REST_API': JSON.stringify(REST_API),
    }),
  );
}

module.exports = require('./webpack.base.babel')({
  mode: 'production',
  entry: [
    require.resolve('@babel/polyfill'),
    path.join(process.cwd(), entry),
  ],
  output: {
    publicPath,
    filename: '[name].1[chunkhash].js',
    chunkFilename: '[name].1[chunkhash].chunk.js',
    jsonpFunction,
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          warnings: false,
          compress: {
            comparisons: false,
          },
          parse: {},
          mangle: true,
          output: {
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
        cache: true,
        sourceMap: true,
      }),
    ],
    nodeEnv: 'production',
    sideEffects: true,
    concatenateModules: true,
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 10,
      minSize: 0,
      automaticNameDelimiter: '030',
    },
    runtimeChunk: 'single',
  },
  plugins,
  performance: {
    assetFilter: assetFilename =>
      !/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename),
  },
});
