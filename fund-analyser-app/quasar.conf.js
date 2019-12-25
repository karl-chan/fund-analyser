// Configuration for your app
const webpack = require('webpack')

module.exports = function (ctx) {
  return {
    // app boot (/src/boot)
    boot: [
      'axios',
      'components',
      'services',
      'utils',
      'third-party-libraries'
    ],
    css: [
      'app.styl',
      '../../node_modules/ag-grid-community/dist/styles/ag-grid.css',
      '../../node_modules/ag-grid-community/dist/styles/ag-theme-balham.css'
    ],
    extras: [
      'roboto-font',
      'material-icons',
      // 'ionicons-v4',
      // 'mdi-v3',
      'fontawesome-v5'
    ],

    // https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-framework
    framework: {
      iconSet: 'material-icons', // Quasar icon set
      lang: 'en-us', // Quasar language pack

      // Possible values for "all":
      // * 'auto' - Auto-import needed Quasar components & directives
      //            (slightly higher compile time; next to minimum bundle size; most convenient)
      // * false  - Manually specify what to import
      //            (fastest compile time; minimum bundle size; most tedious)
      // * true   - Import everything from Quasar
      //            (not treeshaking Quasar; biggest bundle size; convenient)
      all: 'auto',

      components: [
        'QIcon' // needed by reflection in ag-grid
      ],
      directives: [],

      // Quasar plugins
      plugins: [
        'Dialog',
        'Notify'
      ]
    },

    // https://quasar.dev/quasar-cli/cli-documentation/supporting-ie
    supportIE: false,

    // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-build
    build: {
      scopeHoisting: true,
      vueRouterMode: 'hash',
      vueCompiler: true,
      gzip: true,
      // analyze: true,
      // extractCSS: false,
      // useNotifier: false,
      extendWebpack (cfg) {
        cfg.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules|quasar)/
        })
        cfg.module.rules.push({
          test: /\.pug$/,
          loader: 'pug-plain-loader'
        })
        cfg.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))
      },
      devtool: 'source-map'
    },
    devServer: {
      // https: true,
      port: 8080,
      open: false, // opens browser window automatically,
      proxy: {
        // proxy all requests starting with /api to jsonplaceholder
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    // animations: 'all' --- includes all animations
    animations: [
      'fadeOutUp'
    ]
  }
}
