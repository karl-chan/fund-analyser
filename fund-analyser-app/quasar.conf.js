// Configuration for your app

module.exports = function (ctx) {
  return {
    // app plugins (/src/plugins)
    plugins: [
      'axios',
      'components',
      'services',
      'utils'
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
    vendor: {
      add: [],
      remove: []
    },
    build: {
      scopeHoisting: true,
      vueRouterMode: 'hash',
      vueCompiler: true,
      gzip: true,
      analyze: true,
      // extractCSS: false,
      // useNotifier: false,
      extendWebpack (cfg) {
        cfg.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules|quasar)/
        })
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
        'QTooltip',
        'QIcon',
        'QList',
        'QListHeader',
        'QItem',
        'QItemMain',
        'QItemSide',
        'QItemSeparator',
        'QAutocomplete',
        'QInput',
        'QAlert',
        'QTable',
        'QTh',
        'QTr',
        'QTd',
        'QTableColumns',
        'QSpinner',
        'QSpinnerFacebook'
      ],
      directives: [
        'Ripple'
      ],
      // Quasar plugins
      plugins: [
        'LocalStorage'
      ]
    },
    // animations: 'all' --- includes all animations
    animations: [
      'fadeOutUp'
    ],
    cordova: {
      id: 'com.github.karlchan'
    },
    electron: {
      extendWebpack (cfg) {
        // do something with cfg
      },
      packager: {
        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',

        // Window only
        // win32metadata: { ... }
      }
    },

    // leave this here for Quasar CLI
    starterKit: '1.0.0'
  }
}
