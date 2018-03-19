
export default [
  {
    path: '/',
    component: () => import('layouts/default'),
    children: [
      { path: 'fund/:isin', name: 'fund', component: () => import('pages/fund/FundPage'), props: true },
      { path: '', name: 'home', component: () => import('pages/index') }
    ]
  },

  { // Always leave this as last one
    path: '*',
    component: () => import('pages/404')
  }
]
