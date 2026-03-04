const { ModuleFederationPlugin } = require('webpack').container;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: './src/main',
  mode: 'development',
  target: 'web',
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  optimization: {
    minimize: true,
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512_000,
    maxAssetSize: 512_000
  },
  module: {
    rules: [
      {
        test: /\.svg/,
        type: 'asset/resource'
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            ["@babel/preset-react", {"runtime": "automatic"}]
          ],
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new CopyPlugin({ patterns: [{ from: 'sw.js' }] }),
    new ModuleFederationPlugin({
      name: 'webpackHost',
      filename: 'remoteEntry.js',
      remotes: {
        viteRemote: `promise import("http://localhost:5001/remoteEntry.js")`,
      },
      shared: {
        react: {
          singleton: true,
        },
        'react-dom': {
          singleton: true,
        },
      },
    }),
  ],
  devServer: {
    port: 3000,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
};