const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackPwaManifest = require('../../../dist')

module.exports = {
  entry: path.join(__dirname, '../app.js'),
  output: {
    path: path.join(__dirname, '../output'),
    publicPath: '/',
    filename: '[name].[hash].bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      minify: {
        minifyCSS: true,
        minifyJS: true,
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
        preserveLineBreaks: false,
        removeAttributeQuotes: true,
        removeComments: true
      }
    }),
    new WebpackPwaManifest({
      name: 'My Progressive Web App',
      short_name: 'MyPWA',
      description: 'My awesome Progressive Web App!',
      background_color: '#ffffff',
      ios: true,
      icons: [
        {
          src: path.resolve('./tests/preserve-filename/input/icons/apple_icon_512x384.png'),
          sizes: '512x384',
          destination: 'icons',
          preserve_aspect_ratio: true,
          preserve_filename: true
        },
        {
          src: path.resolve('./tests/preserve-filename/input/icons/apple_icon_630x1024.svg'),
          size: '630x1024',
          destination: 'icons',
          preserve_aspect_ratio: true,
          preserve_filename: true
        },
        {
          src: path.resolve('./tests/preserve-filename/input/icons/apple_icon_1024x768.png'),
          size: '1024x768',
          destination: 'icons',
          color: '#ffffff',
          preserve_aspect_ratio: true,
          preserve_filename: true
        }
      ]
    })
  ]
}
