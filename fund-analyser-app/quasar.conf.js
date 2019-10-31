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
    supportIE: true,
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
    // framework: 'all' --- includes everything; for dev only!
    framework: {
      components: [
        'QLayout',
        'QHeader',
        'QDrawer',
        'QPageContainer',
        'QPage',
        'QToolbar',
        'QToolbarTitle',
        'QBtn',
        'QBtnGroup',
        'QExpansionItem',
        'QChip',
        'QDialog',
        'QTooltip',
        'QIcon',
        'QList',
        'QItem',
        'QItemLabel',
        'QItemSection',
        'QSelect',
        'QInput',
        'QCheckbox',
        'QBanner',
        'QCard',
        'QCardSection',
        'QCardActions',
        'QTable',
        'QTr',
        'QTd',
        'QTabs',
        'QTab',
        'QTabPanels',
        'QTabPanel',
        'QSpinner',
        'QSpinnerFacebook',
        'QSpinnerDots',
        'QSlideTransition',
        'QVirtualScroll',
        'QAjaxBar',
        'QAvatar'
      ],
      directives: [
        'ClosePopup',
        'Ripple'
      ],
      plugins: [
        'Dialog',
        'Notify'
      ]
    },
    // animations: 'all' --- includes all animations
    animations: [
      'fadeOutUp'
    ]
  }
}
