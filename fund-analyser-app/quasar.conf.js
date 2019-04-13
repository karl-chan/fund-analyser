// Configuration for your app
const webpack = require('webpack')

module.exports = function (ctx) {
  return {
    // app plugins (/src/plugins)
    plugins: [
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
      ctx.theme.mat ? 'roboto-font' : null,
      'material-icons',
      // 'ionicons',
      // 'mdi',
      'fontawesome'
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
        'QLayoutHeader',
        'QLayoutDrawer',
        'QPageContainer',
        'QPage',
        'QToolbar',
        'QToolbarTitle',
        'QBtn',
        'QBtnGroup',
        'QCollapsible',
        'QChip',
        'QDialog',
        'QModal',
        'QTooltip',
        'QIcon',
        'QList',
        'QListHeader',
        'QItem',
        'QItemMain',
        'QItemSide',
        'QItemSeparator',
        'QItemTile',
        'QAutocomplete',
        'QInput',
        'QSearch',
        'QCheckbox',
        'QAlert',
        'QCard',
        'QCardTitle',
        'QCardMain',
        'QCardMedia',
        'QTable',
        'QTr',
        'QTd',
        'QTabs',
        'QTab',
        'QTabPane',
        'QSpinner',
        'QSpinnerFacebook',
        'QSpinnerDots',
        'QSlideTransition',
        'QInfiniteScroll',
        'QAjaxBar'
      ],
      directives: [
        'Ripple',
        'CloseOverlay'
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
