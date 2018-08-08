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
      '../../node_modules/ag-grid/dist/styles/ag-grid.css',
      '../../node_modules/ag-grid/dist/styles/ag-theme-balham.css'
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
        'QPageSticky',
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
        'QCheckbox',
        'QAlert',
        'QTable',
        'QTh',
        'QTr',
        'QTd',
        'QTableColumns',
        'QSpinner',
        'QSpinnerFacebook',
        'QAjaxBar',
        'QSlideTransition'
      ],
      directives: [
        'Ripple'
      ]
    },
    // animations: 'all' --- includes all animations
    animations: [
      'fadeOutUp'
    ]
  }
}
